import React from "react";
import { Link } from "react-router-dom";
import { FileSearch, Globe } from "lucide-react";

export default function ClaimsBreakdown({ claims }) {
  if (!claims?.length) return null;
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Claim sources</h3>
      <ol className="space-y-2.5 text-sm">
        {claims.map((c, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground h-fit">{i + 1}</span>
            <div className="min-w-0">
              <p className="leading-snug">{c.claim}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                {c.source_type === "web" ? (
                  <>
                    <Globe className="h-3 w-3 shrink-0" />
                    <a href={c.web_url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{c.web_title || c.web_url}</a>
                  </>
                ) : (
                  <>
                    <FileSearch className="h-3 w-3 shrink-0" />
                    <Link to={`/products/${c.doc_id}`} className="text-primary hover:underline">{c.doc_id}</Link>
                    {c.field && <span>· field: <span className="font-mono">{c.field}</span></span>}
                  </>
                )}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}