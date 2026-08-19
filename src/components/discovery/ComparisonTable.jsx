import React from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import ProductImage from "@/components/discovery/ProductImage";

export default function ComparisonTable({ rows, topPickId, products }) {
  const navigate = useNavigate();
  if (!rows?.length) return null;
  const imageByDoc = new Map((products || []).map((p) => [p.doc_id, p.image_url]));
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <h3 className="text-sm font-semibold p-4 pb-2 text-muted-foreground uppercase tracking-wide">Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium text-right">Price</th>
              <th className="p-3 font-medium text-right">Rating</th>
              <th className="p-3 font-medium">Ingredients</th>
              <th className="p-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isTop = r.doc_id === topPickId;
              const isWeb = String(r.doc_id || "").startsWith("web_");
              const img = imageByDoc.get(r.doc_id);
              return (
                <tr
                  key={r.doc_id}
                  onClick={() => r.doc_id && !isWeb && navigate(`/products/${r.doc_id}`)}
                  className={`border-b last:border-0 ${isWeb ? "" : "cursor-pointer hover:bg-muted/60"} ${isTop ? "bg-primary/5" : ""}`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      {img && <ProductImage src={img} alt={r.title} className="h-10 w-10 shrink-0 rounded object-contain bg-muted" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isTop && <span className="text-xs font-semibold text-primary">Top pick</span>}
                          <span className="font-medium leading-tight">{r.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{r.doc_id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono">
                    {typeof r.price === "number" ? `$${r.price.toFixed(2)}` : "—"}
                  </td>
                  <td className="p-3 text-right">
                    {typeof r.rating === "number" ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {r.rating.toFixed(1)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{r.ingredients || "—"}</td>
                  <td className="p-3 text-muted-foreground">{r.note || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}