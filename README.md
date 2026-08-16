# Voice Product Discovery 
Agentic Voice-to-Voice AI Assistant

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
