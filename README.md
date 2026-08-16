# Voice Product Discovery — Agentic Voice-to-Voice AI Assistant

Speak a product request → **Whisper** transcribes it → a **LangGraph**
multi-agent pipeline (router → planner → retriever → answerer/critic) plans
which **MCP tools** to call — `rag.search` over a private Amazon-2020 catalog
index and `web.search` for live price/availability — reconciles conflicts
and answers with a **~15-second spoken summary** plus:

- on-screen citations
- a comparison table
- a full agent step log

Built as a self-contained repo: React (Vite) frontend + Python FastAPI
backend. No external platform dependencies — everything the agent does runs
from this repository.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/aimanaltoubi/voice-product-discovery2/blob/main/colab_launch.ipynb)
Cloud demo no local setup is needed=

**Try saying:**
- *“Find me an eco-friendly stainless-steel cleaner under fifteen dollars.”* → private-catalog path
- *“What’s the current price of a glass cleaner right now?”* → adds live `web.search` + reconciliation
- *“Can I mix bleach and ammonia for a stronger cleaner?”* → safety gate blocks with a safe spoken refusal

---

## Architecture (short version)

```
Browser (React) ── /api/transcribe ─▶ Whisper ASR (faster-whisper | OpenAI)
      │                /api/discover ─▶ LangGraph:
      │                                router → [safety] → planner
      │                                  → retrieve(rag.search + rerank)
      │                                  → [web_compare → reconcile | web_fallback]
      │                                  → answerer/critic
      │                /api/speak ────▶ TTS (edge-tts | OpenAI) → mp3
      │                                        │
      └── step log · table · citations   MCP client ──── MCP JSON-RPC ───▶ MCP server
                                                        web.search (cache + rate limit + trusted sites)
                                                        rag.search (Chroma retrieval)
```

Full detail: [`docs/architecture.md`](docs/architecture.md) ·
tool contracts: [`docs/mcp_schemas.md`](docs/mcp_schemas.md) ·
guardrails: [`docs/safety.md`](docs/safety.md) ·
data pipeline: [`data/README.md`](data/README.md) ·
prompts + node mapping: [`prompts/README.md`](prompts/README.md)

## Quickstart

Prereqs:

- Python 3.11+ (3.12 tested)
- Node 18+
- a microphone-capable browser

```bash
# 1) backend deps
cd backend
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2) configuration
cp ../.env.example ../.env     # then edit: set OPENAI_API_KEY (LLM_PROVIDER=openai)

# 3) build the private-catalog index from the Kaggle Amazon-2020 CSV
#    (download it once — see data/README.md — into data/raw/)
python -m rag.ingest --csv ../data/raw/marketing_sample_for_amazon_com-ecommerce__20200101_20200131__10k_data.csv --limit 2000

# 4) frontend deps
cd ../frontend && npm install

# 5) run both (from repo root)
cd .. && PY=backend/.venv/bin/python ./run.sh
#    or manually in two terminals:
#    (backend)  cd backend && python -m uvicorn app.main:app --port 8000 --loop asyncio
#    (frontend) cd frontend && npm run dev
```

Open http://localhost:5173 then allow the microphone and talk. First
transcription downloads the local Whisper model once (~150 MB for `base`);
set `ASR_PROVIDER=openai` to skip local models entirely.

> **Note the `--loop asyncio` flag** (run.sh passes it for you): the MCP
> transport does not work under uvloop so the backend must run on the
> stock asyncio event loop.

### Run in Colab (zero local setup)

[`colab_launch.ipynb`](colab_launch.ipynb) launches everything on a free
Colab VM and prints a public **HTTPS** URL (Cloudflare quick tunnel) so the
browser microphone works:

1. Open the notebook via the badge above.
2. Colab sidebar → **Secrets** (the key icon) → add `OPENAI_API_KEY` →
   enable **Notebook access**. The key stays in your Google account; anyone
   else running the notebook uses their own secret — the notebook requires
   the key and stops with a clear message without it.
3. **Runtime → Run all**. Wait ~10 min on the first run. Open the printed
   `https://….trycloudflare.com` URL.
4. After a good run: **File → Save a copy in GitHub** (this repository with
   path `colab_launch.ipynb`) so the notebook's outputs are stored with
   the code.

The Colab path serves the built UI and the API from **one** port via
`scripts/serve_colab.py` (also handy for any single-port hosting). The URL
is ephemeral and lives only while the notebook runs — a demo runtime rather than
hosting.

## Configuration

Everything is env-driven — see [`.env.example`](.env.example). Highlights:

| Variable | Options (default first) | Purpose |
|---|---|---|
| `LLM_PROVIDER` / `LLM_MODEL` | `openai:gpt-4o-mini` / anthropic / google_genai / ollama | model-agnostic LLM via LangChain `init_chat_model` |
| `EMBEDDINGS_PROVIDER` | `local` (ONNX MiniLM) / openai | RAG index embeddings |
| `ASR_PROVIDER` | `local` (faster-whisper) / openai | Whisper transcription |
| `TTS_PROVIDER` | `edge` (keyless) / openai | speech synthesis |
| `WEB_SEARCH_PROVIDER` | `ddg` (keyless) / serper / brave / tavily | backend for `web.search` |
| `WEB_CACHE_TTL_SECONDS` | 180 (clamped 60–300) | `web.search` response cache |
| `WEB_ALLOWED_DOMAINS` / `WEB_ALLOWLIST_STRICT` | retail/review list | trusted-site limit for web results |

## Repository layout

```
frontend/                React + Vite UI (mic + transcript + step log + table + citations + audio)
backend/
  app/                   FastAPI gateway (/api/transcribe + /api/discover + /api/speak + /api/health)
  graph/                 LangGraph: state schemas + nodes + wiring + model-agnostic LLM layer
  mcp_server/            MCP server (web.search + rag.search) + client
  rag/                   ingest (CSV → parquet + Chroma) + embedders + retrieval
  speech/                Whisper ASR + TTS
  logs/ · media/ · storage/   runtime artifacts (git-ignored)
prompts/                 ALL runtime prompts + node mapping (Prompt Disclosure)
data/                    Kaggle download instructions + processed parquet (ignored)
docs/                    architecture + MCP schemas + safety
run.sh · .env.example
```


| item | Where it’s satisfied |
|---|---|
| **Functionality** (end-to-end voice flow; multi-agent routing; citations shown) | Mic → `/api/transcribe` (Whisper) → `/api/discover` (LangGraph in `backend/graph/`) → `/api/speak` (TTS auto-plays). Router/planner/retriever/answerer + safety and reconcile nodes with conditional edges (`graph/build.py`). Citations rendered with `doc_id` (private) and URLs (live) — `CitationList.jsx` built in `graph/build.py`. |
| **Agentic RAG Quality** (accurate retrieval; grounded answers; sensible hybrid use) | Embeddings over title+features+review snippets (`rag/ingest.py`) in Chroma; vector + metadata filters (price/category/material/eco) with a logged relaxation ladder (`rag/retrieval.py`); LLM reranker validated in code; answerer grounded to retrieved rows with citation/top-pick validation and price-per-oz normalization. |
| **MCP Server** (two tools working; discovery & schemas; caching/logging) | Exactly `web.search` + `rag.search` (`mcp_server/server.py`). MCP transport (or HTTP). Standard `tools/list` discovery with JSON schemas (visible at `GET /api/health`). TTL cache 60–300 s + per-tool rate limits. JSONL logging with timestamps and source URLs. Contracts: `docs/mcp_schemas.md`. |
| **Planning & Tool Use** (clear plans; conflict handling; reconciliation) | Planner LLM output + tool-policy enforcement in code (“prefer rag.search; add web.search only for current/latest/availability”) with `enforced_rules` in the step log (`nodes.py::planner_node`); reconcile node matches catalog↔web by normalized title/brand similarity (SKU-less web rows) and flags >15 % price deltas and availability; critic forces discrepancy mention into the spoken answer. |
| **UI/UX** (clean app; transcript; comparison table; audio playback) | React app: `MicRecorder` (record/upload) + editable transcript + `AgentStepLog` (every node’s input/output/timestamp) + `ComparisonTable` (price + $/oz + rating + ingredients + top-pick highlight) + `CitationList` + auto TTS playback with replay. |
| **Prompt Disclosure** | [`prompts/`](prompts/) is the **runtime source** (loaded by `graph/prompts.py` rather than copies): system prompt + router with few-shots + planner (its tool policy verbatim) + reranker + answerer/critic + a prompt→node→schema mapping table in `prompts/README.md`. Prompts and provider names are logged per step. |

Also demonstrated: timestamped Whisper ASR (`speech/asr.py`) and TTS with
a ~40-word spoken summary ending in the *“most affordable or highest
rated?”* follow-up (`prompts/answerer.md` + `speech/tts.py`); model-agnostic
LLM via env (`graph/llm.py`); `.env.example` + `run.sh`; safety
(trusted-site limits + no unsafe chemical advice + no keys in logs —
`docs/safety.md`); Amazon-2020 ingestion with parquet outputs
(`data/README.md`).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/api/discover` hangs forever | You’re on uvloop. Run uvicorn with `--loop asyncio` (run.sh does). The dependency list deliberately installs plain `uvicorn` rather than `uvicorn[standard]`. |
| `rag.search` returns `index_not_built` | Run `python -m rag.ingest --csv ../data/raw/<kaggle-file>.csv` (from `backend/`). |
| “index was built with embedder X but current is Y” | Re-run ingest after changing `EMBEDDINGS_PROVIDER` — the index refuses mismatched embedders on purpose. |
| First transcription is slow / downloads | faster-whisper fetches the model once; or set `ASR_PROVIDER=openai`. |
| TTS error mentioning `speech.platform.bing.com` | Your network blocks Edge TTS; set `TTS_PROVIDER=openai`. |
| `web.search` returns zero results | DuckDuckGo throttling or offline; results degrade gracefully (the step log shows the error). Configure Serper/Brave/Tavily keys for reliability. |
| Mic button does nothing | Browsers require `localhost` or HTTPS for `getUserMedia`; use the Vite URL rather than a LAN IP. |
