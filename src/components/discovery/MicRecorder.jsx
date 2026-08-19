import React, { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const MicRecorder = forwardRef(function MicRecorder({ onAudio, disabled }, ref) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "request.webm", { type: "audio/webm" });
        onAudio?.(file);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (e) {
      setError("Microphone access was blocked. You can type your request below instead.");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center">
        {recording && (
          <>
            <span className="absolute inline-flex h-10 w-10 rounded-full bg-destructive/40 animate-ping" />
            <span className="absolute inline-flex h-10 w-10 rounded-full bg-destructive/20 animate-pulse" />
          </>
        )}
        <Button
          type="button"
          size="lg"
          variant={recording ? "destructive" : "default"}
          className="relative rounded-full h-10 w-10 p-0 shadow-lg"
          onClick={recording ? stop : start}
          disabled={disabled}
          aria-label={recording ? "Stop recording" : "Start recording"}
        >
          {disabled && !recording ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : recording ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {recording ? "Listening… tap to stop" : "Tap and speak your request"}
      </p>
      {error && <p className="text-xs text-destructive text-center max-w-xs">{error}</p>}
    </div>
  );
});

export default MicRecorder;