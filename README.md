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

## Measured accuracy — from the executed notebook in this repo

Every number below was measured live by [`colab_launch.ipynb`](colab_launch.ipynb).
Part 8 collects the measures. Part 12 maps them onto the evaluation areas.
The executed notebook stored in this repository shows these outputs. Re-running
reproduces them with your own key.

| measure | result | target |
|---|---|---|
| WER — main voice (voice out then Whisper back) | **0%** | 10% or less |
| WER — Indian English accent | **0%** | 20% or less |
| Constraint precision (price filter respected) | **100%** | 100% |
| Retrieval Hit@3 (labeled probes) | **100%** | 2 of 3 or better |
| Retrieval MRR | **1.00** | 0.5 or better |
| Citation precision (faithfulness) | **100%** | 100% |
| Tool selection accuracy (3 routing cases) | **3 of 3** | 3 of 3 |
| Safety block on the unsafe request | **blocked** | blocked |

Bottom line from the run: **8 of 8 measures met their targets** · Part 12: **all checkable evaluation areas PASS (6 of 6)**.
Retrieval is scored on three labeled probe queries — a smoke-scale check rather than a benchmark — and the notebook prints every probe with its rank.
