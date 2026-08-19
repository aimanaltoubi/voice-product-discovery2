"""Shared graph state + structured-output schemas.

`DiscoveryState` is the single state object threaded through the LangGraph
nodes. The Pydantic models define the JSON contracts the LLM must return at
each reasoning node; they mirror the instructions in `prompts/*.md` exactly
(the prompts are the human-readable side of the same contract). Deterministic
nodes (safety, reconcile) write plain dicts.
"""

from __future__ import annotations

import operator
from typing import Annotated, Any, List, Literal, Optional

from pydantic import BaseModel, Field
from typing_extensions import TypedDict


# --------------------------------------------------------------------------
# LangGraph state
# --------------------------------------------------------------------------

class DiscoveryState(TypedDict, total=False):
    transcript: str
    router: dict[str, Any]            # RouterOutput.model_dump()
    plan: dict[str, Any]              # PlanOutput.model_dump() + enforcement notes
    candidates: list[dict[str, Any]]  # raw rag.search rows
    top_picks: list[dict[str, Any]]   # reranked rows (<=3), or web fallback rows
    web: dict[str, Any]               # web.search payload (compare or fallback)
    reconciliation: dict[str, Any]    # discrepancy flags per doc_id
    answer: dict[str, Any]            # AnswerOutput.model_dump()
    mode: str                         # "private" | "web_fallback"
    blocked: bool
    prior_constraints: dict[str, Any]   # carried in from the previous turn
    refusal_prefix: str                  # set when a mixed request's unsafe part was refused
    # Every node appends its own entries; operator.add concatenates them
    # in execution order for the UI's agent step log.
    steps: Annotated[list[dict[str, Any]], operator.add]


# --------------------------------------------------------------------------
# Structured-output contracts (see prompts/README.md for the mapping)
# --------------------------------------------------------------------------

class Constraints(BaseModel):
    """Constraints the router extracts from the utterance (prompts/router.md)."""
    budget: Optional[float] = Field(
        default=None, description="Budget ceiling in USD, if stated.")
    material: Optional[str] = Field(
        default=None, description="Surface/material, e.g. 'stainless steel'.")
    brand: Optional[str] = None
    category: Optional[str] = Field(
        default=None, description="Product category, e.g. 'cleaner'.")
    eco_friendly: Optional[bool] = Field(
        default=None, description="True only if eco/green/natural was implied.")



class Claim(BaseModel):
    """One factual statement in the spoken answer with its source."""
    claim: str = Field(description="The factual statement made in the answer.")
    source_type: Literal["catalog", "web"] = "catalog"
    doc_id: Optional[str] = Field(default=None, description="Catalog doc_id backing the claim.")
    field: Optional[str] = Field(default=None, description="Which product field backs it (price, eco_friendly, features).")
    web_url: Optional[str] = None
    web_title: Optional[str] = None


class RouterOutput(BaseModel):
    """Intent and constraint extraction plus safety and freshness flags."""
    task: str = Field(
        default="product_recommendation",
        description="Short task label, e.g. 'product_recommendation'.")
    constraints: Constraints = Field(default_factory=Constraints)
    safety_flags: List[str] = Field(
        default_factory=list,
        description="Non-empty if the request seeks unsafe chemical advice.")
    intent: str = Field(
        default="product_search",
        description="One of product_search | price_check | general_question.",
    )
    freshness_needed: bool = Field(
        default=False,
        description="True when the request is about current price or stock or availability.",
    )
    permissible_query: Optional[str] = Field(
        default=None,
        description="When the request mixes a safe part with an unsafe part: the safe part alone. Null otherwise.",
    )
    needs_live: bool = Field(
        default=False,
        description="True if the user asked for current/latest price, stock or availability.")


class RetrievalFilters(BaseModel):
    """Metadata filters for the private catalog (prompts/planner.md)."""
    category: Optional[str] = None
    max_price: Optional[float] = None
    material: Optional[str] = None
    eco_friendly: Optional[bool] = None


class PlanOutput(BaseModel):
    """Which MCP tools to call and with what filters and criteria."""
    sources: List[Literal["rag.search", "web.search"]] = Field(
        default_factory=lambda: ["rag.search"])
    retrieval_filters: RetrievalFilters = Field(default_factory=RetrievalFilters)
    comparison_criteria: List[str] = Field(
        default_factory=lambda: ["price", "rating"])


class RerankOutput(BaseModel):
    """Ordering of retrieved candidates (prompts/reranker.md)."""
    ranked_doc_ids: List[str] = Field(
        description="doc_ids of the top candidates, best first, max 3. "
                    "Must be a subset of the provided candidate doc_ids.")
    rationale: str = ""


class AnswerOutput(BaseModel):
    """Final grounded answer (prompts/answerer.md)."""
    spoken_answer: str = Field(
        description="~40-word spoken summary ending with the "
                    "affordable-vs-highest-rated follow-up question.")
    top_pick_doc_id: str = Field(
        default="", description="doc_id of the top pick; must exist in the rows.")
    citation_doc_ids: List[str] = Field(default_factory=list)
    claims: List[Claim] = Field(
        default_factory=list,
        description="Every factual statement in the spoken answer with its source. Order matches the [n] markers.",
    )
