import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const PRICE_OPTIONS = [10, 25, 50, 100];
const RATING_OPTIONS = [4, 3];

function FilterField({ label, children }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export default function FilterChips({ facets, filters, onChange }) {
  if (!facets) return null;
  const set = (patch) => onChange({ ...filters, ...patch });

  const priceMax = facets.price?.max;
  const priceOptions =
    typeof priceMax === "number" ? PRICE_OPTIONS.filter((b) => b <= Math.ceil(priceMax) + 1) : [];
  const categories = facets.categories || [];
  const brands = facets.brands || [];
  const colors = facets.colors || [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground/70">Filters:</span>

      {priceOptions.length > 0 && (
        <FilterField label="Price">
          <Select
            value={filters.budget ? String(filters.budget) : "any"}
            onValueChange={(v) => set({ budget: v === "any" ? undefined : Number(v) })}
          >
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any price</SelectItem>
              {priceOptions.map((b) => (
                <SelectItem key={b} value={String(b)}>Under ${b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      )}

      {categories.length > 0 && (
        <FilterField label="Category">
          <Select
            value={filters.category || "any"}
            onValueChange={(v) => set({ category: v === "any" ? undefined : v })}
          >
            <SelectTrigger className="h-7 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any category</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      )}

      {colors.length > 0 && (
        <FilterField label="Color">
          <Select
            value={filters.color || "any"}
            onValueChange={(v) => set({ color: v === "any" ? undefined : v })}
          >
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any color</SelectItem>
              {colors.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      )}

      {facets.has_ratings && (
        <FilterField label="Rating">
          <Select
            value={filters.min_rating ? String(filters.min_rating) : "any"}
            onValueChange={(v) => set({ min_rating: v === "any" ? undefined : Number(v) })}
          >
            <SelectTrigger className="h-7 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any rating</SelectItem>
              {RATING_OPTIONS.map((r) => (
                <SelectItem key={r} value={String(r)}>{r}★ & up</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      )}

      {brands.length > 0 && (
        <FilterField label="Brand">
          <Select
            value={filters.brand || "any"}
            onValueChange={(v) => set({ brand: v === "any" ? undefined : v })}
          >
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any brand</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      )}

      {facets.eco_count > 0 && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <Checkbox
            checked={filters.eco_friendly === true}
            onCheckedChange={(v) => set({ eco_friendly: v ? true : undefined })}
          />
          Eco-friendly
        </label>
      )}

      {facets.amazon_count > 0 && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <Checkbox
            checked={filters.is_amazon_seller === true}
            onCheckedChange={(v) => set({ is_amazon_seller: v ? true : undefined })}
          />
          Amazon seller
        </label>
      )}
    </div>
  );
}