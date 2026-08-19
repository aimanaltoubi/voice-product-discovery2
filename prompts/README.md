# Prompt Disclosure

Every prompt the agents use lives in this folder as plain markdown. These
files are not copies - backend/graph/prompts.py loads them at run time - so
what you read here is exactly what the model receives.

Placeholders use <<name>> syntax and are substituted by the node before the
model call (see render() in backend/graph/prompts.py).

## Prompt to node mapping

| Prompt file | LangGraph node | Structured output schema | Placeholders |
|---|---|---|---|
| system.md | prepended to every model call (system message) | - | - |
| router.md | router (intent classifier) | RouterOutput | <<transcript>> and <<few_shots>> |
| few_shots_router.md | injected into router.md | - | - |
| planner.md | planner | PlanOutput | <<router_json>> and <<transcript>> |
| reranker.md | retrieve (the rerank stage of rag.search) | RerankOutput | <<transcript>> and <<criteria_json>> and <<candidates_json>> |
| answerer.md | answer (answerer and critic) | AnswerOutput | <<transcript>> and <<criteria_json>> and <<mode>> and <<products_json>> and <<web_json>> |

## Steps with no prompt

Three pipeline steps use no prompt because deterministic code is more
auditable for these jobs:

- safety - a keyword net plus the router flags block unsafe requests with a
  fixed refusal (backend/graph/nodes.py and backend/graph/dv.py)
- reconcile - brand and title matching between catalog and live results plus
  price-difference flags (backend/graph/nodes.py)
- the MCP tools web.search and rag.search - pure retrieval with no
  generation (backend/mcp_server/server.py)

## The planner rule - stated and enforced

planner.md states the rule: always call rag.search - add web.search when
live data is needed or the intent is a product search or a price check - a
general question stays catalog only. planner_node then enforces the same
rule deterministically after the model call - so a wrong plan can neither
skip the catalog nor drop the live source when it is due.
