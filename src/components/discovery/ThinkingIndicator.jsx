import React from "react";

// Subtle staggered-pulse dots + the current pipeline stage label.
// Shown while the agent is transcribing, searching, or synthesizing.
export default function ThinkingIndicator({ stageLabel }) {
  if (!stageLabel) return null;
  return (
    <div className="mt-3 flex items-center justify-center gap-2.5 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:200ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:400ms]" />
      </div>
      <span>{stageLabel}</span>
    </div>
  );
}