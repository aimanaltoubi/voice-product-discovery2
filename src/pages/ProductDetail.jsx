import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/api/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import ProductDetailCard from "@/components/discovery/ProductDetailCard";

export default function ProductDetail() {
  const { docId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const items = await api.entities.Product.filter({ doc_id: docId });
        if (active) setProduct(items?.[0] || null);
      } catch (e) {
        if (active) setError(e?.message || "Failed to load product");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [docId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to assistant
        </Link>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !product ? (
          <p className="text-sm text-muted-foreground">No product found for “{docId}”.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source record</span>
              <h1 className="font-heading text-xl font-bold tracking-tight mt-1">{product.title}</h1>
            </div>
            <ProductDetailCard product={product} />
          </div>
        )}
      </div>
    </div>
  );
}