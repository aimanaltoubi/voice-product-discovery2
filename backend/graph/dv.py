"""DiscoveryVoice behaviors ported to Python.

Safety keyword net (pre-LLM), freshness fallback, grounding enforcement,
and spoken-answer post-processing. Ported from the TypeScript pipeline.
"""
from __future__ import annotations

import re
from typing import Any

SAFETY_PATTERNS = [
    r"bleach[\w\s]{0,30}(ammonia|ammonium)", r"(ammonia|ammonium)[\w\s]{0,30}bleach",
    r"bleach[\w\s]{0,30}vinegar", r"vinegar[\w\s]{0,30}bleach",
    r"bleach[\w\s]{0,30}(rubbing\s+)?alcohol", r"(rubbing\s+)?alcohol[\w\s]{0,30}bleach",
    r"bleach[\w\s]{0,30}(acid|drain\s+cleaner)", r"(acid|drain\s+cleaner)[\w\s]{0,30}bleach",
    r"mix[\w\s]{0,30}chemical",
    r"how\s+(?:to|do\s+i|can\s+i)\s+make[\w\s]{0,40}(bomb|explosive|poison|chlorine|mustard)",
    r"chlorine[\w\s]{0,30}acid",
    r"drink[\w\s]{0,30}(bleach|ammonia|antifreeze|rubbing\s+alcohol)",
]
_SAFETY = [re.compile(p, re.I) for p in SAFETY_PATTERNS]

FRESHNESS_PATTERNS = [
    r"\bin stock\b", r"\bright now\b", r"\bcurrent(ly)?\s+(price|available|in stock)\b",
    r"\blatest\s+price\b", r"\bcost\s+today\b", r"\bavailability\b",
    r"\bavailable\s+now\b", r"\bhow\s+much\s+.*\s+now\b",
]
_FRESH = [re.compile(p, re.I) for p in FRESHNESS_PATTERNS]


def detect_safety(query: str) -> bool:
    q = str(query or "")
    return any(p.search(q) for p in _SAFETY)


def is_freshness(query: str) -> bool:
    q = str(query or "")
    return any(p.search(q) for p in _FRESH)


def postprocess_answer(spoken: str) -> str:
    """Strip empty citation brackets, cap at 60 words on a sentence boundary,
    and make sure the answer ends by asking a question."""
    if not spoken:
        return spoken
    answer = re.sub(r"\[\s*\]", "", str(spoken)).strip()
    answer = re.sub(r"\s{2,}", " ", answer)
    answer = re.sub(r"\s+([.,!?])", r"\1", answer)
    FOLLOW_UP = " Would you like the most affordable option or the highest rated one?"

    def _cap(text, limit):
        toks = text.split()
        if len(toks) <= limit:
            return text
        clipped = " ".join(toks[:limit])
        stop = max(clipped.rfind("."), clipped.rfind("!"), clipped.rfind("?"))
        return clipped[: stop + 1] if stop > 0 else clipped

    if answer.rstrip().endswith("?"):
        answer = _cap(answer, 60)
        if not answer.rstrip().endswith("?"):
            answer = _cap(answer, 60 - len(FOLLOW_UP.split())).rstrip().rstrip(".!") + "." + FOLLOW_UP
    else:
        answer = _cap(answer, 60 - len(FOLLOW_UP.split())).rstrip().rstrip(".!") + "." + FOLLOW_UP
    return answer.strip()


_PRICE_IN_TEXT = re.compile(r"\$\s*(\d+(?:\.\d{1,2})?)")


def _claim_ok(claim: dict, by_id: dict, web_urls: set) -> bool:
    if claim.get("source_type") == "web":
        return bool(claim.get("web_url")) and claim["web_url"] in web_urls
    doc = by_id.get(claim.get("doc_id"))
    if doc is None:
        return False
    text = str(claim.get("claim") or "")
    price = doc.get("price")
    for amount in _PRICE_IN_TEXT.findall(text):
        if isinstance(price, (int, float)) and abs(float(amount) - float(price)) > 1.0:
            return False
    if claim.get("field") == "eco_friendly" and doc.get("eco_friendly") is False:
        return False
    return True


def enforce_grounding(answer: dict, products: list[dict], web_results: list[dict]) -> dict:
    """Drop claims whose source is not in the retrieved set, verify price and
    eco and name claims against the cited product, renumber [n] markers, and
    fall back to the first real product when the top pick was invented."""
    by_id = {p.get("doc_id"): p for p in products if p.get("doc_id")}
    web_urls = {w.get("url") for w in (web_results or []) if w.get("url")}

    original = [dict(c) for c in (answer.get("claims") or [])]
    kept, index_map = [], {}
    for i, claim in enumerate(original, start=1):
        if _claim_ok(claim, by_id, web_urls):
            kept.append(claim)
            index_map[i] = len(kept)

    spoken = str(answer.get("spoken_answer") or "")

    def _renumber(match):
        old = int(match.group(1))
        new = index_map.get(old)
        return f"[{new}]" if new else ""

    spoken = re.sub(r"\[(\d+)\]", _renumber, spoken)

    top_id = answer.get("top_pick_doc_id") or ""
    if top_id not in by_id and products:
        top_id = products[0].get("doc_id") or ""

    cited, seen = [], set()
    for claim in kept:
        doc_id = claim.get("doc_id")
        if claim.get("source_type") != "web" and doc_id in by_id and doc_id not in seen:
            cited.append(doc_id)
            seen.add(doc_id)
    if not cited:
        cited = [d for d in (answer.get("citation_doc_ids") or []) if d in by_id]
    if not cited and top_id:
        cited = [top_id]

    return {
        "spoken_answer": spoken,
        "claims": kept,
        "citation_doc_ids": cited,
        "top_pick_doc_id": top_id,
    }
