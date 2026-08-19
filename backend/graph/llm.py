"""Model-agnostic LLM access.

The graph nodes never talk to a provider SDK directly; they call
`call_structured(prompt, Schema, node=...)`. The provider/model is selected via
env (LLM_PROVIDER / LLM_MODEL) and instantiated through LangChain's
`init_chat_model`, so swapping OpenAI <-> Anthropic <-> Gemini <-> Ollama is a
config change only (brief: "Model-Agnostic Requirement").

"""
from __future__ import annotations

from functools import lru_cache
from typing import Any, Type, TypeVar

from pydantic import BaseModel

from app.config import settings

T = TypeVar("T", bound=BaseModel)

_PROVIDER_MAP = {
    "openai": "openai",
    "anthropic": "anthropic",
    "google": "google_genai",
    "google_genai": "google_genai",
    "gemini": "google_genai",
    "ollama": "ollama",
}


@lru_cache(maxsize=1)


class _MockStructured:
    """Schema-aware stand-in for offline runs. Heuristic outputs only."""

    def __init__(self, schema):
        self.schema = schema

    async def ainvoke(self, prompt: str):
        import re as _re
        from graph import dv as _dv
        text = str(prompt)
        m = _re.search(r'request:\s*"([^"]+)"', text)
        transcript = m.group(1) if m else text[-200:]
        name = self.schema.__name__
        if name == "RouterOutput":
            words = {"ten": 10, "fifteen": 15, "twenty": 20, "twenty five": 25,
                     "thirty": 30, "forty": 40, "fifty": 50}
            budget = None
            m = _re.search(r"(?:under|below|less than)\s+(\d+)", transcript, _re.I)
            if m:
                budget = float(m.group(1))
            else:
                for word, value in words.items():
                    if _re.search(rf"(?:under|below|less than)\s+{word}", transcript, _re.I):
                        budget = float(value)
                        break
            eco = bool(_re.search(r"eco|biodegrad|plant.based", transcript, _re.I)) or None
            material = "microfiber" if "microfiber" in transcript.lower() else None
            fresh = _dv.is_freshness(transcript)
            flags = ["mock_flag"] if _dv.detect_safety(transcript) else []
            return self.schema(
                task="price_check" if fresh else "product_recommendation",
                intent="price_check" if fresh else "product_search",
                constraints={"budget": budget, "eco_friendly": eco, "material": material},
                safety_flags=flags, needs_live=fresh, freshness_needed=fresh,
            )
        if name == "PlanOutput":
            live = '"needs_live": true' in text or '"freshness_needed": true' in text
            m = _re.search(r'"budget":\s*(\d+(?:\.\d+)?)', text)
            eco = '"eco_friendly": true' in text or None
            mat = "microfiber" if '"material": "microfiber"' in text else None
            return self.schema(
                sources=["rag.search", "web.search"] if live else ["rag.search"],
                retrieval_filters={"max_price": float(m.group(1)) if m else None,
                                   "eco_friendly": eco, "material": mat},
                comparison_criteria=["price", "rating"],
            )
        if name == "RerankOutput":
            ids = _re.findall(r"AMZ2020-\w+", text)
            seen, ranked = set(), []
            for i in ids:
                if i not in seen:
                    ranked.append(i)
                    seen.add(i)
                if len(ranked) == 3:
                    break
            return self.schema(ranked_doc_ids=ranked, rationale="mock order")
        if name == "AnswerOutput":
            ids = []
            for i in _re.findall(r"AMZ2020-\w+", text):
                if i not in ids:
                    ids.append(i)
            top = ids[0] if ids else ""
            spoken = ("I found solid options for you. The top pick fits your request well [1]. "
                      "I've sent details and sources to your screen. "
                      "Would you like the most affordable option or the highest rated one?")
            claims = ([{"claim": "The top pick matches your request well.",
                        "source_type": "catalog", "doc_id": top, "field": "features"}]
                      if top else [])
            return self.schema(spoken_answer=spoken, top_pick_doc_id=top,
                               citation_doc_ids=ids[:2], claims=claims)
        return self.schema()


class _MockChat:
    def with_structured_output(self, schema):
        return _MockStructured(schema)

def get_chat_model():
    """Instantiate the chat model once from env config."""
    from langchain.chat_models import init_chat_model

    if settings.LLM_PROVIDER == "mock":
        return _MockChat()
    provider = _PROVIDER_MAP.get(settings.LLM_PROVIDER)
    if provider is None:
        raise ValueError(
            f"Unknown LLM_PROVIDER={settings.LLM_PROVIDER!r}. "
            "Use openai | anthropic | google_genai | mock."
        )
    return init_chat_model(settings.LLM_MODEL, model_provider=provider, temperature=0)


async def call_structured(
    prompt: str,
    schema: Type[T],
    *,
    node: str,
    context: dict[str, Any] | None = None,
) -> T:
    """Run one structured LLM call and return a validated `schema` instance.

    `context` carries the raw state a node already has (kept for logging and
    future verification hooks; the rendered prompt is the model input).
    """
    model = get_chat_model().with_structured_output(schema)
    return await model.ainvoke(prompt)
