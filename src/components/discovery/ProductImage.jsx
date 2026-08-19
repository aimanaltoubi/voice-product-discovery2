import React, { useState } from "react";
import { Package } from "lucide-react";

// The dataset stores image_url as a pipe-separated list and includes a junk
// transparent-pixel entry. Pick the first usable URL from the list.
function pickFirstUrl(src) {
  if (!src) return "";
  const first = String(src).split("|").map((s) => s.trim()).find((u) => {
    if (!u) return false;
    if (u.includes("transparent-pixel")) return false;
    return /\.(jpg|jpeg|png|webp|gif|bmp)/i.test(u);
  });
  return first || "";
}

export default function ProductImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  const url = pickFirstUrl(src);
  if (!url || failed) {
    return (
      <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}>
        <Package className="h-8 w-8 opacity-40" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt || ""}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}