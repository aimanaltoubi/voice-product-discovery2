import React from "react";
import { Star, Leaf, Droplet, Tag, ScrollText, MessageSquareQuote, Package, Ruler, Weight, Palette, ShoppingCart, ExternalLink, Truck, ListChecks, Boxes, Store } from "lucide-react";
import ProductImage from "@/components/discovery/ProductImage";

function Row({ icon, label, children }) {
  if (!children && children !== 0) return null;
  return (
    <div className="flex gap-2.5 text-sm">
      <span className="flex items-center gap-1.5 shrink-0 w-28 text-muted-foreground">
        {icon} {label}
      </span>
      <span className="min-w-0 whitespace-pre-wrap leading-relaxed">{children}</span>
    </div>
  );
}

export default function ProductDetailCard({ product }) {
  if (!product) return null;
  const features = (product.features || "").split(/\n+/).map((f) => f.trim()).filter(Boolean);
  const reviews = (product.review_snippets || "").split(/\n+/).map((r) => r.trim()).filter(Boolean);
  const specs = (product.specifications || "").split(/\n|•|\|/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="mt-2 mb-3 rounded-lg border bg-muted/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium leading-snug">{product.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground font-mono truncate">{product.doc_id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {typeof product.price === "number" && (
            <span className="rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-semibold">
              ${product.price.toFixed(2)}
            </span>
          )}
          {typeof product.rating === "number" && (
            <span className="inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs">
              <Star className="h-3 w-3 fill-current" /> {product.rating}
            </span>
          )}
          {product.eco_friendly && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
              <Leaf className="h-3 w-3" /> Eco
            </span>
          )}
          {product.is_amazon_seller && (
            <span className="inline-flex items-center gap-0.5 rounded-full border bg-card px-2 py-0.5 text-xs">
              <Store className="h-3 w-3" /> Amazon
            </span>
          )}
        </div>
      </div>

      {product.image_url && (
        <ProductImage src={product.image_url} alt={product.title} className="h-44 w-full max-w-xs object-contain rounded-md border bg-card" />
      )}

      <div className="space-y-2">
        <Row icon={<Tag className="h-3.5 w-3.5" />} label="Brand">{product.brand}</Row>
        <Row icon={<Package className="h-3.5 w-3.5" />} label="Category">{product.category}</Row>
        <Row icon={<Palette className="h-3.5 w-3.5" />} label="Color">{product.color}</Row>
        {typeof product.size_oz === "number" && (
          <Row icon={<Droplet className="h-3.5 w-3.5" />} label="Size">
            {product.size_oz} oz
            {typeof product.price_per_oz === "number" && (
              <span className="text-muted-foreground"> · ${product.price_per_oz.toFixed(2)}/oz</span>
            )}
          </Row>
        )}
        <Row icon={<Boxes className="h-3.5 w-3.5" />} label="Variant">{product.size_variant}</Row>
        <Row icon={<Ruler className="h-3.5 w-3.5" />} label="Dimensions">{product.dimensions}</Row>
        <Row icon={<Weight className="h-3.5 w-3.5" />} label="Ship weight">{product.shipping_weight}</Row>
        <Row icon={<Truck className="h-3.5 w-3.5" />} label="Stock">{product.stock}</Row>
        <Row icon={<ScrollText className="h-3.5 w-3.5" />} label="Ingredients">{product.ingredients}</Row>
        <Row icon={<ListChecks className="h-3.5 w-3.5" />} label="Directions">{product.directions}</Row>
      </div>

      {features.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            <ScrollText className="h-3.5 w-3.5" /> Features
          </p>
          <ul className="space-y-1 text-sm list-disc pl-5">
            {features.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}

      {specs.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            <ListChecks className="h-3.5 w-3.5" /> Specifications
          </p>
          <ul className="space-y-1 text-sm list-disc pl-5">
            {specs.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {product.variants && (
        <Row icon={<Boxes className="h-3.5 w-3.5" />} label="Variants">{product.variants}</Row>
      )}

      {reviews.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            <MessageSquareQuote className="h-3.5 w-3.5" /> Review snippets
          </p>
          <ul className="space-y-1.5 text-sm">
            {reviews.map((r, i) => (
              <li key={i} className="border-l-2 border-border pl-2 italic text-muted-foreground">"{r}"</li>
            ))}
          </ul>
        </div>
      )}

      {product.product_url && (
        <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ShoppingCart className="h-4 w-4" /> View product <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}