import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "discoveryvoice_turns_v1";

export default function Export() {
  const [done, setDone] = useState(false);
  const doExport = () => {
    const turns = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const payload = {
      exported_at: new Date().toISOString(),
      app: "DiscoveryVoice",
      turns,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "discoveryvoice_history.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setDone(true);
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-xl px-4 py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to assistant
        </Link>
        <div className="rounded-2xl border bg-card p-8 text-center space-y-4">
          <FileText className="h-10 w-10 mx-auto text-primary" />
          <h1 className="text-xl font-semibold">Export your conversations</h1>
          <p className="text-sm text-muted-foreground">
            Downloads every saved turn - the question - the spoken answer - the picks and
            citations - as one JSON file from this browser.
          </p>
          <Button onClick={doExport} className="gap-2">
            <Download className="h-4 w-4" /> Download history
          </Button>
          {done && <p className="text-xs text-muted-foreground">Saved. Check your downloads folder.</p>}
        </div>
      </div>
    </div>
  );
}
