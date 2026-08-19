"""The app server: the three requests the screen calls (transcribe then discover then speak).

    POST /api/transcribe  audio blob      -> {transcript, segments, ...}
    POST /api/discover    {transcript}    -> full agent payload (steps, answer, table, citations)
    POST /api/speak       {text}          -> {audio_url}  (mp3 under /media)

On startup the app launches the MCP tool server as a stdio subprocess and
performs tool discovery; the discovered catalog is visible at /api/health.
Each /api/discover run is persisted as JSONL under backend/logs/runs/.

Run from backend/:  uvicorn app.main:app --reload --port 8000
"""

from __future__ import annotations

import json
import logging
import tempfile
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.config import DATA_DIR, MEDIA_DIR, RUN_LOGS_DIR, settings
from graph.build import run_discovery
from mcp_server.client import MCPToolClient
from speech.asr import transcribe as asr_transcribe
from speech.tts import synthesize

log = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    mcp = MCPToolClient()
    await mcp.start()
    app.state.mcp = mcp
    log.info(
        "MCP server started (stdio). Discovered tools: %s",
        [t["name"] for t in mcp.tool_catalog],
    )
    try:
        yield
    finally:
        await mcp.stop()


app = FastAPI(title="Voice Product Discovery API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")


# --------------------------------------------------------------------------
# schemas
# --------------------------------------------------------------------------

class DiscoverRequest(BaseModel):
    transcript: str | None = None
    query: str | None = None
    history: list | None = None
    prior_context: dict | None = None
    constraints: dict | None = None

    @property
    def text(self) -> str:
        return (self.transcript or self.query or "").strip()



class SpeakRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


# --------------------------------------------------------------------------
# endpoints
# --------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "llm": f"{settings.LLM_PROVIDER}:{settings.LLM_MODEL}",
        "asr": settings.ASR_PROVIDER,
        "tts": settings.TTS_PROVIDER,
        "embeddings": settings.EMBEDDINGS_PROVIDER,
        "mcp_tools": app.state.mcp.tool_catalog,
    }


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    """Save a recording and hand back a /media address for it."""
    suffix = Path(file.filename or "clip.webm").suffix or ".webm"
    name = f"upload_{uuid.uuid4().hex[:10]}{suffix}"
    dest = MEDIA_DIR / name
    dest.write_bytes(await file.read())
    return {"file_url": f"/media/{name}"}


@app.post("/api/transcribe")
async def transcribe(request: Request, audio: UploadFile | None = File(default=None)):
    # two doors: a direct multipart file - or JSON {audio_url} pointing at /media
    if audio is None and "application/json" in (request.headers.get("content-type") or ""):
        body = await request.json()
        audio_url = str(body.get("audio_url") or "")
        name = audio_url.split("/media/")[-1].split("?")[0]
        local = MEDIA_DIR / name
        if not name or not local.exists():
            raise HTTPException(status_code=400, detail="audio_url must point at an uploaded /media file.")
        try:
            result = await asr_transcribe(str(local))
        except Exception as e:
            log.exception("ASR failed")
            raise HTTPException(status_code=500, detail=f"Transcription failed: {e}") from e
        if not result.get("transcript"):
            raise HTTPException(status_code=422, detail="No speech detected in the recording.")
        return result
    if audio is None:
        raise HTTPException(status_code=400, detail="Send a multipart file or JSON with audio_url.")
    return await _transcribe_upload(audio)


async def _transcribe_upload(audio: UploadFile):
    suffix = Path(audio.filename or "clip.webm").suffix or ".webm"
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    try:
        tmp.write(await audio.read())
        tmp.close()
        result = await asr_transcribe(tmp.name)
    except Exception as e:  # surfaced to the UI's error banner
        log.exception("ASR failed")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}") from e
    finally:
        Path(tmp.name).unlink(missing_ok=True)
    if not result.get("transcript"):
        raise HTTPException(status_code=422, detail="No speech detected in the recording.")
    return result


@app.post("/api/discover")
async def discover(req: DiscoverRequest):
    started = time.perf_counter()
    try:
        payload = await run_discovery(
            req.text, app.state.mcp,
            history=req.history, prior_context=req.prior_context,
            constraints=req.constraints,
        )
    except Exception as e:
        log.exception("Discovery pipeline failed")
        raise HTTPException(status_code=500, detail=f"Discovery failed: {e}") from e

    # Persist the full run for observability / grading evidence.
    run_id = uuid.uuid4().hex[:10]
    record = {
        "run_id": run_id,
        "duration_ms": round((time.perf_counter() - started) * 1000, 1),
        "llm": f"{settings.LLM_PROVIDER}:{settings.LLM_MODEL}",
        **payload,
    }
    try:
        with (RUN_LOGS_DIR / f"{time.strftime('%Y%m%d')}.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except OSError:
        log.warning("Could not persist run log for %s", run_id)
    return payload




_PRODUCTS_CACHE = {"df": None, "mtime": None}


def _products_df():
    import pandas as pd
    parquet = DATA_DIR / "processed" / "products.parquet"
    if not parquet.exists():
        raise HTTPException(status_code=503, detail="Catalog not built yet. Run the ingest step first.")
    mtime = parquet.stat().st_mtime
    if _PRODUCTS_CACHE["df"] is None or _PRODUCTS_CACHE["mtime"] != mtime:
        _PRODUCTS_CACHE["df"] = pd.read_parquet(parquet)
        _PRODUCTS_CACHE["mtime"] = mtime
    return _PRODUCTS_CACHE["df"]


def _product_row(row) -> dict:
    import math
    out = {}
    for key, value in row.items():
        if hasattr(value, "item"):
            value = value.item()
        if isinstance(value, float) and math.isnan(value):
            value = None
        out[key] = value
    out["image_url"] = out.pop("image", None)
    out["specifications"] = out.pop("specs", None)
    return out


@app.get("/api/products")
async def products(sort: str = "-rating", limit: int = 200, doc_id: str | None = None):
    df = _products_df()
    if doc_id:
        rows = df[df.doc_id == doc_id]
        return [_product_row(r) for _, r in rows.iterrows()]
    column = sort.lstrip("-")
    if column in df.columns:
        df = df.sort_values(column, ascending=not sort.startswith("-"), na_position="last")
    return [_product_row(r) for _, r in df.head(max(1, min(int(limit), 1000))).iterrows()]


@app.get("/api/products/{doc_id}")
async def product_detail(doc_id: str):
    df = _products_df()
    rows = df[df.doc_id == doc_id]
    if rows.empty:
        raise HTTPException(status_code=404, detail="No product with that doc_id.")
    return _product_row(rows.iloc[0])


@app.post("/api/evaluate")
async def evaluate(request: Request):
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    from app.evaluation import run_evaluation
    return await run_evaluation(
        app.state.mcp,
        skip_asr=bool(body.get("skip_asr")),
        skip_judge=bool(body.get("skip_judge")),
    )


@app.post("/api/speak")
async def speak(req: SpeakRequest):
    # parity with the original app: strip inline [n] citation markers so the
    # voice never reads them - and cap at ~37 words (a fifteen second read)
    import re as _re
    text = _re.sub(r"\s*\[\d[\d,\s\-]*\]", "", str(req.text or "")).strip()
    words = text.split()
    if len(words) > 37:
        clipped = " ".join(words[:37])
        stop = max(clipped.rfind("."), clipped.rfind("!"), clipped.rfind("?"))
        text = clipped[: stop + 1] if stop > 0 else clipped
    try:
        filename = await synthesize(text)
    except Exception as e:
        log.exception("TTS failed")
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {e}") from e
    return {"audio_url": f"/media/{filename}"}
