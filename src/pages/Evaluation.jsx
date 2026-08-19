import React, { useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Loader2, Play, CheckCircle2, XCircle, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function Evaluation() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runEval = async () => {
    setError("");
    setLoading(true);
    setReport(null);
    try {
      const res = await api.functions.invoke("evaluate", { stage: "all" });
      setReport(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Evaluation failed");
    } finally {
      setLoading(false);
    }
  };

  const summary = report?.summary;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Evaluation results</h1>
            <p className="text-sm text-muted-foreground mt-1">Runs the curated test suite through the full discovery pipeline.</p>
          </div>
          <Link to="/"><Button variant="outline" size="sm">Back to assistant</Button></Link>
        </div>

        <Button onClick={runEval} disabled={loading} className="mb-6">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          <span className="ml-1.5">{loading ? "Running eval…" : "Run evaluation"}</span>
        </Button>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">⚠️ {error}</div>
        )}

        {summary && (
          <div className="grid gap-3 sm:grid-cols-3 mb-6">
            <MetricCard label="Accuracy" value={`${summary.accuracy}%`} sub={`${summary.passed}/${summary.total} passed`} />
            <MetricCard label="Avg latency" value={`${summary.avgLatencyMs}ms`} sub={`${summary.latencyBudgetFailures} budget failures`} />
            <MetricCard label="Failed" value={summary.failed} sub={`${summary.total} total cases`} />
          </div>
        )}

        {report?.router?.metrics && (
          <Section title="Router classification">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Macro precision" value={(report.router.metrics.macroPrecision ?? 0).toFixed(3)} />
              <MetricCard label="Macro recall" value={(report.router.metrics.macroRecall ?? 0).toFixed(3)} />
              <MetricCard label="Macro F1" value={(report.router.metrics.macroF1 ?? 0).toFixed(3)} />
              <MetricCard label="Accuracy" value={(report.router.metrics.accuracy ?? 0).toFixed(3)} />
            </div>
          </Section>
        )}

        {report?.retrieval && (
          <Section title="Retrieval ranking">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="P@3" value={(report.retrieval.meanPAt3 ?? 0).toFixed(3)} />
              <MetricCard label="MRR" value={(report.retrieval.meanMRR ?? 0).toFixed(3)} />
              <MetricCard label="NDCG@3" value={(report.retrieval.meanNDCG3 ?? 0).toFixed(3)} />
            </div>
          </Section>
        )}

        {report?.answer && (
          <Section title="Answer quality (RAGAS-style)">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Faithfulness" value={(report.answer.meanFaithfulness ?? 0).toFixed(3)} />
              <MetricCard label="Answer relevance" value={(report.answer.meanAnswerRelevance ?? 0).toFixed(3)} />
            </div>
          </Section>
        )}

        {report?.results && (
          <Section title="Case results">
            <ul className="divide-y rounded-xl border bg-card">
              {report.results.map((r) => (
                <li key={r.id} className="flex items-start gap-3 p-3 text-sm">
                  {r.pass
                    ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                    : <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />}
                  <div className="min-w-0">
                    <p className="font-medium">{r.id} <span className="text-xs text-muted-foreground">· {r.category}</span></p>
                    <p className="text-xs text-muted-foreground truncate">{r.query}</p>
                    <p className="text-xs mt-0.5">{r.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {!loading && !report && !error && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <LinkIcon className="h-3.5 w-3.5" /> Press “Run evaluation” to benchmark the pipeline.
          </p>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold font-mono mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  );
}