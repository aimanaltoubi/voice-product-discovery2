import React from "react";
import { BookOpen, Globe } from "lucide-react";
import CitationItem from "@/components/discovery/CitationItem";

export default function CitationList({ citations, webResults, comparisonRows }) {
  if (!citations?.length && !webResults?.length) return null;

  const metaByDoc = {};
  (comparisonRows || []).forEach((r) => {
    if (r?.doc_id) metaByDoc[r.doc_id] = r;
  });
  const hasCatalog = !!citations?.length;
  const hasWeb = !!webResults?.length;

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
        <BookOpen className="h-4 w-4" /> Sources
      </h3>

      {hasCatalog && (
        <div>
          {hasWeb && (
            <p className="text-xs font-semibold text-muted-foreground/80 mb-2 uppercase tracking-wide">Catalog</p>
          )}
          <ul className="space-y-1 text-sm">
            {(citations || []).map((c, i) => (
              <CitationItem key={`c-${i}`} citation={c} index={i} meta={metaByDoc[c.doc_id] || {}} />
            ))}
          </ul>
        </div>
      )}

      {hasWeb && (
        <div className={hasCatalog ? "mt-4" : ""}>
          {hasCatalog && (
            <p className="text-xs font-semibold text-muted-foreground/80 mb-2 uppercase tracking-wide flex items-center gap-1">
              <Globe className="h-3 w-3" /> Live web
            </p>
          )}
          <ul className="space-y-1.5 text-sm">
            {(webResults || []).map((w, i) => (
              <li key={`w-${i}`} className="flex gap-2 items-baseline">
                <span className="shrink-0">🌐</span>
                <a href={w.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                  {w.title || w.url}
                </a>
                {typeof w.price === "number" && (
                  <span className="text-muted-foreground shrink-0">· ${w.price.toFixed(2)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}