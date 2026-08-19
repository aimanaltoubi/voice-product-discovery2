import React from "react";
import { CheckCircle2, ShieldAlert, Search, Globe, GitCompare, MessageSquareText, Route } from "lucide-react";

const ICONS = {
  router: Route,
  safety: ShieldAlert,
  planner: Route,
  "rag.search": Search,
  "web.search": Globe,
  reconcile: GitCompare,
  answerer: MessageSquareText
};

export default function AgentStepLog({ steps }) {
  if (!steps?.length) return null;
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Agent steps</h3>
      <ol className="space-y-2.5">
        {steps.map((step, i) => {
          const Icon = ICONS[step.name] || CheckCircle2;
          return (
            <li key={i} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-medium">{step.name}</p>
                <p className="text-xs text-muted-foreground break-words">
                  {step.name === "router" && JSON.stringify(step.output?.constraints)}
                  {step.name === "planner" && `sources: ${(step.output?.sources || []).join(", ")}`}
                  {step.name === "safety" && (step.output?.reason || "blocked")}
                  {step.name === "rag.search" &&
                    `${step.output?.results?.length || 0} results · ${step.output?.rerank?.rationale || ""}`.trim()}
                  {step.name === "web.search" && `${step.output?.results?.length || 0} live results`}
                  {step.name === "reconcile" &&
                    `${Object.keys(step.output?.matches || {}).length} matched · ${(step.output?.discrepancy_flags || []).length} flags`}
                  {step.name === "answerer" && step.output?.top_pick?.title}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}