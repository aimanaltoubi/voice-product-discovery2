import React from "react";
import { Volume2, ShieldAlert, SearchX, Globe } from "lucide-react";
import ComparisonTable from "@/components/discovery/ComparisonTable";
import CitationList from "@/components/discovery/CitationList";
import ClaimsBreakdown from "@/components/discovery/ClaimsBreakdown";
import ExportExcelButton from "@/components/discovery/ExportExcelButton";
import ProductImage from "@/components/discovery/ProductImage";
import SpokenAnswer from "@/components/discovery/SpokenAnswer";

export default function ConversationTurn({ turn, index, onAnswerEnded }) {
  const { query, result, audioUrl } = turn;
  if (!result) return null;

  const ragStep = (result.steps || []).find((s) => s.name === "rag.search");
  const resultCount = ragStep?.output?.results?.length || 0;
  const webStep = (result.steps || []).find((s) => s.name === "web.search");
  const webResults = webStep?.output?.results || [];
  const hasWebOptions = webResults.length > 0;
  const noResults = !result.blocked && resultCount === 0;
  const topPickImage = result.top_pick ? (result.products || []).find((p) => p.doc_id === result.top_pick.doc_id)?.image_url : undefined;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-3 text-sm">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          You said{typeof index === "number" ? ` · turn ${index + 1}` : ""}
        </span>
        <p className="mt-1">{query}</p>
      </div>

      {result.blocked ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/5 p-4 text-sm">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
          <p>{result.spoken_answer}</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-primary text-primary-foreground p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-80 mb-2">
              <Volume2 className="h-4 w-4" /> Spoken answer
            </div>
            <SpokenAnswer text={result.spoken_answer} claims={result.claims || []} products={result.products || []} />
            {audioUrl && <audio controls src={audioUrl} onEnded={onAnswerEnded} className="mt-4 w-full" />}
          </div>

          {noResults && (
            <div className={`rounded-xl border p-4 text-sm ${hasWebOptions ? "border-primary/30 bg-primary/5" : "border-amber-400/40 bg-amber-400/5"}`}>
              <div className={`flex items-center gap-2 font-medium ${hasWebOptions ? "text-primary" : "text-amber-700 dark:text-amber-400"}`}>
                {hasWebOptions ? <Globe className="h-4 w-4" /> : <SearchX className="h-4 w-4" />}
                {hasWebOptions ? "Not available in the Amazon dataset — showing live web options instead" : "No matching products found"}
              </div>
              <p className="mt-1 text-muted-foreground">
                {hasWebOptions
                  ? "I searched the Amazon product dataset and couldn't find a match for that, so here are live options from the web."
                  : "The agent couldn't find a catalog or web match for that request. Try rephrasing or relaxing a constraint."}
              </p>
            </div>
          )}

          {result.top_pick && (
            <div className="rounded-xl border bg-card p-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">Top pick</span>
              <div className="mt-1 flex gap-3">
                {topPickImage && (
                  <ProductImage src={topPickImage} alt={result.top_pick.title} className="h-16 w-16 shrink-0 rounded object-contain bg-muted" />
                )}
                <div className="min-w-0">
                  <p className="font-medium">{result.top_pick.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {typeof result.top_pick.price === "number" ? `$${result.top_pick.price.toFixed(2)}` : ""}
                    {result.top_pick.reason ? ` — ${result.top_pick.reason}` : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          <ComparisonTable rows={result.comparison_table} topPickId={result.top_pick?.doc_id} products={result.products} />

          <div className="flex justify-end">
            <ExportExcelButton comparisonTable={result.comparison_table} products={result.products} />
          </div>

          <CitationList
            citations={result.citations}
            comparisonRows={result.comparison_table}
            webResults={result.steps?.find((s) => s.name === "web.search")?.output?.results}
          />

          <ClaimsBreakdown claims={result.claims} />
        </>
      )}
    </div>
  );
}