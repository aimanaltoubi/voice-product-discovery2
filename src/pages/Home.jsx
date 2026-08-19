import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Sparkles, ChevronDown, ChevronUp, RotateCcw, Ear, History as HistoryIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import MicRecorder from "@/components/discovery/MicRecorder";
import AgentStepLog from "@/components/discovery/AgentStepLog";
import ConversationTurn from "@/components/discovery/ConversationTurn";
import ThinkingIndicator from "@/components/discovery/ThinkingIndicator";
import RecentSearchChips from "@/components/discovery/RecentSearchChips";
import { useAudioCue } from "@/hooks/useAudioCue";

export default function Home() {
  const STORAGE_KEY = "discoveryvoice_turns_v1";
  const navigate = useNavigate();
  const [typed, setTyped] = useState("");
  const [turns, setTurns] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [pendingQuery, setPendingQuery] = useState("");

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(turns)); } catch {}
  }, [turns]);

  useEffect(() => {
    const focus = localStorage.getItem("discoveryvoice_focus");
    if (focus == null) return;
    localStorage.removeItem("discoveryvoice_focus");
    const el = turnRefs.current[Number(focus)];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "rounded-xl");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary", "rounded-xl"), 2000);
    }
  }, [turns]);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState("");
  const [showSteps, setShowSteps] = useState(false);
  const recorderRef = useRef(null);
  const turnRefs = useRef([]);
  const [autoListen, setAutoListen] = useState(true);
  const playCue = useAudioCue();

  useEffect(() => {
    if (!loadingStage) return;
    const map = { transcribing: "listening", discovering: "processing", speaking: "speaking" };
    playCue(map[loadingStage]);
  }, [loadingStage, playCue]);

  const runPipeline = async (query, filters = {}) => {
    setError("");
    setPendingQuery(query);
    setLoadingStage("discovering");
    try {
      const history = turns.flatMap((t) => [
        { role: "user", content: t.query },
        ...(t.result?.spoken_answer ? [{ role: "assistant", content: t.result.spoken_answer }] : []),
      ]);
      let priorContext = null;
      const last = turns[turns.length - 1];
      if (last?.result?.top_pick) {
        const routerStep = (last.result.steps || []).find((s) => s.name === "router");
        priorContext = {
          last_top_pick: {
            title: last.result.top_pick.title,
            price: last.result.top_pick.price,
            doc_id: last.result.top_pick.doc_id,
          },
          last_constraints: routerStep?.output?.constraints || {},
        };
      }
      const res = await api.functions.invoke("discover", { query, history, prior_context: priorContext, constraints: filters });
      const data = res.data;
      if (data?.navigation?.route) {
        navigate(data.navigation.route);
      }
      let audio = "";
      if (data.spoken_answer) {
        setLoadingStage("speaking");
        const speech = await api.functions.invoke("speak", { text: data.spoken_answer });
        audio = speech.data?.audio_url || "";
      }
      setTurns((prev) => [...prev, { query, result: data, audioUrl: audio }]);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Something went wrong");
    } finally {
      setLoadingStage("");
      setPendingQuery("");
    }
  };

  const handleAudio = async (file) => {
    setError("");
    setLoadingStage("transcribing");
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      const tr = await api.functions.invoke("transcribe", { audio_url: file_url });
      const text = (tr.data?.transcript || "").trim();
      if (text) {
        await runPipeline(text);
      } else {
        setError("Couldn't understand the audio. Try again or type your request.");
        setLoadingStage("");
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Transcription failed");
      setLoadingStage("");
    }
  };

  const submitTyped = () => {
    const q = typed.trim();
    if (!q) return;
    setTyped("");
    runPipeline(q);
  };

  const resetConversation = () => {
    setTurns([]);
    setError("");
    setPendingQuery("");
  };

  const handleAnswerEnded = () => {
    if (autoListen && !loadingStage) {
      recorderRef.current?.start();
    }
  };

  const jumpToTurn = (idx) => {
    const el = turnRefs.current[idx];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "rounded-xl");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary", "rounded-xl"), 2000);
    }
  };

  const busy = !!loadingStage;
  const stageLabel = {
    transcribing: "Listening to your voice…",
    discovering: "Running the discovery agent…",
    speaking: "Synthesizing the spoken answer…",
  }[loadingStage];
  const lastTurn = turns[turns.length - 1];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-3xl w-full flex flex-col flex-1 min-h-0 px-4">
        <header className="pt-3 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <h1 className="font-heading text-base sm:text-lg font-bold tracking-tight">
                Ask for a product. Hear the best pick.
              </h1>
            </div>
            <Link to="/history" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition shrink-0">
              <HistoryIcon className="h-3.5 w-3.5" /> History
            </Link>
          </div>
        </header>

        {turns.length > 0 && (
          <div className="shrink-0 pb-2">
            <RecentSearchChips turns={turns} onPick={jumpToTurn} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 pb-4">
          {pendingQuery && busy && (
            <div className="mb-6 rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">You said</span>
              <p className="mt-1">{pendingQuery}</p>
            </div>
          )}

          {turns.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Conversation · {turns.length} {turns.length === 1 ? "turn" : "turns"}
                </span>
                <Button variant="ghost" size="sm" onClick={resetConversation} disabled={busy}>
                  <RotateCcw className="h-3.5 w-3.5" /> <span className="ml-1">Start over</span>
                </Button>
              </div>

              {turns.map((t, i) => (
                <div key={i} ref={(el) => (turnRefs.current[i] = el)}>
                  <ConversationTurn
                    turn={t}
                    index={i}
                    onAnswerEnded={i === turns.length - 1 ? handleAnswerEnded : undefined}
                  />
                </div>
              ))}

              {lastTurn && lastTurn.result?.steps?.length > 0 && (
                <div className="rounded-xl border bg-card">
                  <button
                    onClick={() => setShowSteps((v) => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
                  >
                    <span>Agent step log (latest turn)</span>
                    {showSteps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {showSteps && (
                    <div className="border-t px-4 py-3">
                      <AgentStepLog steps={lastTurn.result.steps} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 pb-3 pt-2 bg-gradient-to-t from-background via-background to-transparent">
          <div className="rounded-2xl border bg-card shadow-sm p-2.5 sm:p-3">
            <MicRecorder ref={recorderRef} onAudio={handleAudio} disabled={busy} />

            <div className="mt-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Ear className="h-3.5 w-3.5" />
              <Label htmlFor="auto-listen" className="cursor-pointer">Keep listening for follow-ups</Label>
              <Switch id="auto-listen" checked={autoListen} onCheckedChange={setAutoListen} disabled={busy} />
            </div>

            <div className="my-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px bg-border flex-1" /> OR TYPE YOUR REQUEST <div className="h-px bg-border flex-1" />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Textarea
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={turns.length ? "Follow up, e.g. 'anything cheaper than that?'" : "e.g. Find me a queen comforter set under forty dollars"}
                className="resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitTyped();
                  }
                }}
              />
              <Button onClick={submitTyped} disabled={busy || !typed.trim()} className="sm:w-28">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="ml-1.5">Ask</span>
              </Button>
            </div>

            {stageLabel && <ThinkingIndicator stageLabel={stageLabel} />}

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <span className="mt-0.5 shrink-0">⚠️</span> {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}