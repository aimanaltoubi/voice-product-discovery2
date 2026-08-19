import React from "react";
import { useNavigate } from "react-router-dom";

// Matches citation markers like [1], [1, 2], or [1-3].
const CITATION_RE = /\[([0-9]+(?:\s*[-,]\s*[0-9]+)*)\]/g;

function expandNumbers(content) {
  const nums = [];
  for (const part of String(content).split(",")) {
    const trimmed = part.trim();
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const a = parseInt(rangeMatch[1], 10);
      const b = parseInt(rangeMatch[2], 10);
      for (let i = a; i <= b; i++) nums.push(i);
    } else {
      const n = parseInt(trimmed, 10);
      if (!isNaN(n)) nums.push(n);
    }
  }
  return nums;
}

export default function SpokenAnswer({ text, claims = [], products = [] }) {
  const navigate = useNavigate();

  // The LLM sometimes numbers markers inconsistently (e.g. [1] and [3] when
  // only 2 claims exist). The claims array is in the order the markers appear,
  // so map each unique citation number (by first appearance) to the next claim
  // rather than trusting the literal number as a 1-based index.
  const numToClaimIndex = new Map();
  let claimCursor = 0;
  let scan;
  CITATION_RE.lastIndex = 0;
  while ((scan = CITATION_RE.exec(text)) !== null) {
    for (const n of expandNumbers(scan[1])) {
      if (!numToClaimIndex.has(n)) {
        numToClaimIndex.set(n, claimCursor);
        claimCursor += 1;
      }
    }
  }

  const handleCitation = (num) => {
    const idx = numToClaimIndex.get(num);
    const claim = Number.isInteger(idx) ? claims[idx] : undefined;
    if (!claim) return;
    if (claim.source_type === "web" && claim.web_url) {
      window.open(claim.web_url, "_blank", "noopener,noreferrer");
      return;
    }
    if (claim.doc_id) {
      navigate(`/products/${claim.doc_id}`);
    }
  };

  const parts = [];
  let lastIndex = 0;
  let match;
  CITATION_RE.lastIndex = 0;
  while ((match = CITATION_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "citation", content: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: "text", value: text.slice(lastIndex) });

  return (
    <p className="text-lg leading-relaxed">
      {parts.map((part, i) => {
        if (part.type === "text") return <React.Fragment key={i}>{part.value}</React.Fragment>;
        const nums = expandNumbers(part.content);
        return (
          <sup key={i} className="ml-0.5 text-primary-foreground">
            [
            {nums.map((n, j) => {
              const idx = numToClaimIndex.get(n);
              const claim = Number.isInteger(idx) ? claims[idx] : undefined;
              const hasTarget =
                claim &&
                ((claim.source_type === "web" && claim.web_url) || claim.doc_id);
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => handleCitation(n)}
                  disabled={!hasTarget}
                  className={
                    hasTarget
                      ? "mx-px font-semibold text-primary-foreground hover:underline cursor-pointer"
                      : "mx-px text-primary-foreground/60 cursor-default"
                  }
                >
                  {n}
                </button>
              );
            })}
            ]
          </sup>
        );
      })}
    </p>
  );
}