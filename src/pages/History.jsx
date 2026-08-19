import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { History as HistoryIcon, ChevronRight, SearchX, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "discoveryvoice_turns_v1";

function valueLabel(row) {
  if (typeof row?.price_per_piece === "number") return `$${row.price_per_piece.toFixed(2)}/pc`;
  if (typeof row?.price_per_oz === "number") return `$${row.price_per_oz.toFixed(2)}/oz`;
  return null;
}

export default function History() {
  const navigate = useNavigate();
  const [turns, setTurns] = useState([]);

  useEffect(() => {
    try {
      setTurns(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
      setTurns([]);
    }
  }, []);

  // Most recent first, capped at 10.
  const recent = turns.slice(-10).reverse();

  const reopen = (reversedIndex) => {
    const originalIndex = turns.length - 1 - reversedIndex;
    localStorage.setItem("discoveryvoice_focus", String(originalIndex));
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground mb-3">
            <HistoryIcon className="h-3.5 w-3.5 text-primary" /> Recent searches
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">History</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your last {Math.min(10, recent.length) || 0} product requests. Tap one to jump back into the comparison.
          </p>
        </header>

        {recent.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            No history yet. Ask the assistant about a product and it will show up here.
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((t, i) => {
              const r = t.result;
              const blocked = r?.blocked;
              const top = r?.top_pick;
              const topRow = r?.comparison_table?.find((row) => row.doc_id === top?.doc_id);
              const compared = r?.comparison_table?.length || 0;
              return (
                <button
                  key={i}
                  onClick={() => reopen(i)}
                  className="w-full text-left rounded-xl border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-snug">{t.query}</p>
                    {blocked ? (
                      <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <ShieldAlert className="h-3 w-3" /> Blocked by safety filter
                      </p>
                    ) : compared === 0 ? (
                      <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <SearchX className="h-3 w-3" /> No matching products
                      </p>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {top && <span className="text-foreground font-medium truncate max-w-full">{top.title}</span>}
                        {typeof top?.price === "number" && <span>${top.price.toFixed(2)}</span>}
                        {compared > 0 && <span>{compared} compared</span>}
                        {valueLabel(topRow) && <span>{valueLabel(topRow)}</span>}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate("/")}>Back to assistant</Button>
        </div>
      </div>
    </div>
  );
}