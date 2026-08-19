# DiscoveryVoice - Voice-to-Voice Product Discovery

An AI shopping assistant that listens to a spoken product request - searches a private Amazon Product Dataset 2020 catalog (Home & Kitchen slice) and live web data - and answers out loud with cited side-by-side recommendations.

Fully self-contained: everything runs from this repository. Clone it - install - run. The screen is React with Tailwind - the brain is FastAPI with a LangGraph pipeline - the two retrieval tools live behind an MCP server - speech runs locally.

[![Run in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/aimanaltoubi/voice-product-discovery2/blob/main/colab_launch.ipynb) - launch the whole system with checks and a public link

[![Evaluation](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/aimanaltoubi/voice-product-discovery2/blob/main/evaluation/evaluation.ipynb) - run the nineteen-measure evaluation

## What it does

1. Voice or text input - a mic recording is transcribed by Whisper on this machine - or type the request
2. Router - extracts intent and constraints (budget - brand - material - eco) plus safety flags and whether live data is needed
3. Safety - a deterministic keyword net runs before any model call and blocks unsafe chemical requests. A mixed request gets its safe part answered with an explicit refusal of the unsafe part
4. Planner - decides the tools: rag.search always - web.search only when freshness is needed
5. rag.search - hybrid retrieval over the private catalog: metadata filters (price - category - material - eco) plus semantic ranking with a rerank step. Returns ranked products with doc_id for citations
6. web.search - live price and availability from known shopping sites with a short cache and a per-minute cap
7. Reconcile - matches the top catalog pick to the best web result and flags price differences above fifteen percent
8. Answerer - writes a short spoken answer with inline [n] markers - a claims list - and citations. A grounding layer then verifies every claim against the retrieved data - drops what it cannot verify - renumbers the markers - and a post-processor caps the answer at sixty words ending with a question
9. Speak - the answer is synthesized to audio (markers stripped - fifteen second cap) and played back

## Architecture

```
Browser (React) -- /api/transcribe --> Whisper ASR (faster-whisper)
      |              /api/discover --> LangGraph:
      |                                router -> [safety] -> planner
      |                                  -> retrieve(rag.search + rerank)
      |                                  -> [web_compare -> reconcile | web_fallback]
      |                                  -> answerer -> grounding -> post-process
      |              /api/speak ----> TTS (edge-tts) -> mp3
      |              /api/products --> catalog browser + product pages
      |              /api/evaluate --> the nineteen-measure harness
      |                                        |
      +-- step log - table - citations   MCP client -- MCP JSON-RPC --> MCP server
          claims breakdown - history                  web.search (cache + rate limit + trusted sites)
                                                      rag.search (Chroma retrieval)
```

## Quickstart (local)

Backend:

```
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python -m rag.ingest --csv <path to the Kaggle CSV> --category "Home & Kitchen"
uvicorn app.main:app --port 8000
```

Frontend (second terminal):

```
npm ci
npm run dev
```

Open http://localhost:5173 - the dev server proxies /api and /media to the backend. For a single-port serve: npx vite build then python scripts/serve_colab.py

Zero-key smoke run: LLM_PROVIDER=mock EMBEDDINGS_PROVIDER=hash runs the whole pipeline offline with a deterministic stand-in model and a test encoder. Real runs use OPENAI_API_KEY with the local MiniLM encoder.

## The dataset slice

- Amazon Product Dataset 2020 by PromptCloud on Kaggle - downloaded at run time and never committed
- slice: Home & Kitchen - 712 products by category-path mention
- fields indexed: title + features text into the embedding - price - category - eco flag - sizes where present as metadata
- what the file does not carry (ratings - reviews - brand values - ingredients) stays empty rather than invented

## How the brief's tasks map to this repository

| Task | Where |
|---|---|
| Voice in and voice out | backend/speech (Whisper + Edge voices) - /api/transcribe - /api/speak - the mic and player in src |
| Agentic pipeline with steps | backend/graph (router - safety - planner - retrieve - rerank - reconcile - answerer) - every step logged with its input and output |
| Exactly two tools over MCP | backend/mcp_server - JSON-RPC server exposing rag.search and web.search with discovery and schemas and a cache and a rate limit |
| Private catalog retrieval | backend/rag (ingest - Chroma index - hybrid search with filters) |
| Live web with reconciliation | the web.search tool plus the reconcile step with discrepancy flags |
| Grounded answers with citations | claims + citations in every answer - backend/graph/dv.py verifies them programmatically |
| Safety | the deterministic keyword net before any model call plus the router flags plus the mixed-request policy |
| Model agnostic | LLM_PROVIDER and LLM_MODEL and EMBEDDINGS_PROVIDER env settings - openai or anthropic or google or ollama or the offline mock |
| Prompt disclosure | the prompts folder - every model instruction the pipeline uses as plain markdown |
| Evaluation | backend/app/evaluation.py - nineteen measures against targets - the in-app page at /evaluation - the notebook in evaluation/ |

## The screen

Conversation turns with the spoken answer and a play button - a top pick card - a comparison table of all matches - grouped citations (catalog + live web) - a claims breakdown linking every statement to its source - an agent step log - recent-search chips - a catalog browser with product pages - history and export.

## Evaluation

The harness runs the real pipeline over a graded case suite and reports nineteen measures against fixed targets (ASR WER and CER - router accuracy and macro F1 and constraint extraction - Precision at 3 and Recall at 3 and 8 and 20 and MRR and NDCG at 3 - hybrid filter compliance - answer faithfulness and relevance - latency budgets - case accuracy - index integrity - reconciliation coverage - provenance). Three ways to run it: the /evaluation page in the app - the evaluation notebook - or POST /api/evaluate.

evaluation/EVALUATION_ANALYSIS.txt documents the closed loop where each failing measure led to a named pipeline fix (the safety keyword net - the grounding layer with the top-pick fallback - the freshness fallback - the soft filter ladder - the sixty-word question-ending cap - the WER normalization). A ProofAgent behavior exam is built into the evaluation notebook and runs when its secrets exist.

## Environment settings

| Variable | Meaning | Default |
|---|---|---|
| OPENAI_API_KEY | the model key for real runs | - |
| LLM_PROVIDER | openai - anthropic - google_genai - ollama - mock | openai |
| LLM_MODEL | the chat model | gpt-4o-mini |
| EMBEDDINGS_PROVIDER | local (MiniLM) - openai - hash (test) | local |
| ASR_PROVIDER | local (faster-whisper) | local |
| TTS_PROVIDER | edge | edge |

## Notes and limitations

- the dataset carries no ratings or reviews in this slice so those fields stay empty and the answerer says a value is unavailable rather than inventing it
- the web cache is in-memory per process - intentional for a demo
- the faithfulness and relevance judges are themselves models - treat their scores as strong signal rather than ground truth
