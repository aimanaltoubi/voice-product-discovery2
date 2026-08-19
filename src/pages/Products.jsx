import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Leaf, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const items = await api.entities.Product.list("-rating", 200);
        if (active) setProducts(items || []);
      } catch {
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = products.filter((p) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return `${p.title} ${p.brand || ""} ${p.category || ""}`.toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Product catalog</h1>
            <p className="text-sm text-muted-foreground mt-1">{products.length} products indexed from the Amazon 2020 dataset</p>
          </div>
          <Link to="/"><Button variant="outline" size="sm">Back to assistant</Button></Link>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by title, brand, or category…" className="pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No products match your filter.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium leading-tight line-clamp-2">{p.title}</h3>
                  {p.eco_friendly && <Leaf className="h-4 w-4 shrink-0 text-emerald-600" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.brand || "Unknown"} · {p.category || "-"}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-mono font-semibold">${typeof p.price === "number" ? p.price.toFixed(2) : "-"}</span>
                  <span className="text-xs text-muted-foreground">
                    {typeof p.price_per_piece === "number"
                      ? `$${p.price_per_piece.toFixed(2)}/pc`
                      : typeof p.price_per_oz === "number"
                        ? `$${p.price_per_oz.toFixed(2)}/oz`
                        : <Package className="h-3.5 w-3.5" />}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}