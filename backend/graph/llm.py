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
def get_chat_model():
    """Instantiate the chat model once from env config."""
    from langchain.chat_models import init_chat_model

    provider = _PROVIDER_MAP.get(settings.LLM_PROVIDER)
    if provider is None:
        raise ValueError(
            f"Unknown LLM_PROVIDER={settings.LLM_PROVIDER!r}. "
            "Use openai | anthropic | google_genai | ollama."
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
