import React from "react";
import { Link } from "react-router-dom";
import { Star, ExternalLink } from "lucide-react";

export default function CitationItem({ citation, index, meta }) {
  const c = citation;
  return (
    <li>
      <Link
        to={`/products/${c.doc_id}`}
        className="group flex gap-2 items-baseline rounded-md px-1.5 py-1 hover:bg-accent transition"
      >
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span title={c.doc_id} className="font-medium group-hover:underline">{c.title || c.doc_id}</span>
          {(typeof meta.price === "number" || typeof meta.rating === "number") && (
            <span className="text-muted-foreground">
              {typeof meta.price === "number" ? ` · $${meta.price.toFixed(2)}` : ""}
              {typeof meta.rating === "number" ? (
                <span className="inline-flex items-center gap-0.5"> · <Star className="h-3 w-3" />{meta.rating}</span>
              ) : ""}
            </span>
          )}
        </span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
      </Link>
    </li>
  );
}