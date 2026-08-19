import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function ExportExcelButton({ comparisonTable, products }) {
  const handleExport = () => {
    const byDoc = {};
    (products || []).forEach((p) => {
      if (p?.doc_id) byDoc[p.doc_id] = p;
    });
    const header = ["Rank", "Doc ID", "Title", "Brand", "Category", "Price", "Price per piece", "Price per oz", "Rating", "Eco friendly", "Note", "Features"];
    const rows = (comparisonTable || []).map((r, i) => {
      const p = byDoc[r.doc_id] || {};
      return [
        i + 1,
        r.doc_id,
        r.title,
        p.brand || "",
        p.category || "",
        typeof r.price === "number" ? r.price : "",
        typeof r.price_per_piece === "number" ? r.price_per_piece : "",
        typeof r.price_per_oz === "number" ? r.price_per_oz : "",
        typeof r.rating === "number" ? r.rating : "",
        p.eco_friendly ? "Yes" : "No",
        r.note || "",
        (p.features || "").replace(/\n+/g, " | ")
      ];
    });
    const table =
      `<table><thead><tr>${header.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>` +
      `<tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const html =
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"></head><body>${table}</body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `discoveryvoice_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={!comparisonTable?.length}>
      <Download className="h-3.5 w-3.5" /> <span className="ml-1">Export to Excel</span>
    </Button>
  );
}