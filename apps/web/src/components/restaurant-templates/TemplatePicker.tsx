"use client";

import { useRouter } from "next/navigation";
import { TEMPLATE_LABELS, TEMPLATE_KEYS, type TemplateKey } from "./types";

const VARIANT_CLASSES: Record<TemplateKey, string> = {
  ming: "bg-rose-50/90 text-rose-800 border-rose-200",
  "ming-slim": "bg-rose-50/90 text-rose-800 border-rose-200",
  "ming-balanced": "bg-rose-50/90 text-rose-800 border-rose-200",
  "ming-full": "bg-rose-50/90 text-rose-800 border-rose-200",
  "night-market": "bg-emerald-50/90 text-emerald-800 border-emerald-200",
  "wok-fire": "bg-amber-50/90 text-amber-800 border-amber-200",
  "metro-grid": "bg-blue-50/90 text-blue-800 border-blue-200",
  "editorial-column": "bg-slate-100/90 text-slate-800 border-slate-300",
  "glass-orbit": "bg-cyan-50/90 text-cyan-800 border-cyan-200",
};

type TemplatePickerProps = {
  basePath: string;
  current: TemplateKey;
  variant: TemplateKey;
};

export function TemplatePicker({
  basePath,
  current,
  variant,
}: TemplatePickerProps) {
  const router = useRouter();

  function buildUrl(key: TemplateKey): string {
    return `${basePath}?template=${key}`;
  }

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as TemplateKey;
    router.push(buildUrl(value));
  }

  return (
    <div
      className={`mb-6 flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${VARIANT_CLASSES[variant]}`}
    >
      <span className="text-xs uppercase tracking-[0.2em]">
        Template
      </span>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold">Choose template</label>
        <select
          value={current}
          onChange={handleChange}
          className="rounded-full border border-white/60 bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm"
        >
          {TEMPLATE_KEYS.map((key) => (
            <option key={key} value={key}>
              {TEMPLATE_LABELS[key]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
