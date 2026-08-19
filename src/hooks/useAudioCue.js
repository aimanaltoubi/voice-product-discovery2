import { useRef, useCallback } from "react";

// Subtle synthesized audio cues via the Web Audio API — no asset files needed.
// Plays a short, soft sine blip to signal pipeline state changes and reduce "dead air".
export function useAudioCue() {
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playCue = useCallback((type = "processing") => {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const presets = {
      listening: { freq: 660, dur: 0.12, gain: 0.05 },
      processing: { freq: 440, dur: 0.18, gain: 0.04 },
      speaking: { freq: 330, dur: 0.14, gain: 0.045 },
    };
    const p = presets[type] || presets.processing;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(p.freq, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(p.gain, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + p.dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + p.dur + 0.02);
  }, [getCtx]);

  return playCue;
}