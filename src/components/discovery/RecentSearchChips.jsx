import React from "react";
import { History as HistoryIcon } from "lucide-react";

// Quick-access chips for recent voice/typed searches, shown on the home screen.
// Clicking a chip scrolls to and highlights that conversation turn.
export default function RecentSearchChips({ turns, onPick }) {
  if (!turns?.length) return null;
  const recent = turns.slice(-8).reverse(); // most recent first, cap 8
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      <span className="shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <HistoryIcon className="h-3 w-3 text-primary" /> Recent
      </span>
      {recent.map((t, i) => {
        const originalIndex = turns.length - 1 - i;
        return (
          <button
            key={i}
            onClick={() => onPick(originalIndex)}
            className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition max-w-[220px] truncate"
            title={t.query}
          >
            {t.query}
          </button>
        );
      })}
    </div>
  );
}