"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  TEMPLATE_KEYS,
  TEMPLATE_LABELS,
  type TemplateKey,
} from "@/components/restaurant-templates/types";

type TemplatePreviewToggleProps = {
  basePath: string;
  current: TemplateKey;
  stateSlug: string;
  citySlug: string;
  restaurantSlug: string;
};

export function TemplatePreviewToggle({
  basePath,
  current,
  stateSlug,
  citySlug,
  restaurantSlug,
}: TemplatePreviewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const isPreview = searchParams.get("preview") === "1";
  const templateParam = searchParams.get("template") as TemplateKey | null;
  const activeTemplate = templateParam ?? current;

  function buildUrl(nextPreview: boolean, nextTemplate?: TemplateKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPreview) {
      params.set("preview", "1");
      params.set("template", nextTemplate ?? activeTemplate);
    } else {
      params.delete("preview");
      params.delete("template");
    }
    const query = params.toString();
    const target = basePath || pathname;
    return query ? `${target}?${query}` : target;
  }

  function handleToggle() {
    router.push(buildUrl(!isPreview));
  }

  function handleTemplateChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as TemplateKey;
    setSaveStatus(null);
    router.push(buildUrl(true, value));
  }

  async function handleSaveTemplate() {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const response = await fetch("/api/template-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateSlug,
          citySlug,
          restaurantSlug,
          templateKey: activeTemplate,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed");
      }
      setSaveStatus("Saved");
      router.push(basePath);
    } catch {
      setSaveStatus("Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1760px] px-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Template Preview
          </p>
          <p className="text-sm text-slate-600">
            {isPreview
              ? "Preview mode is on. Compare styles for your restaurant site."
              : "Compare templates before you decide which style to buy."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isPreview ? (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Choose
              </label>
              <select
                value={activeTemplate}
                onChange={handleTemplateChange}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {TEMPLATE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {TEMPLATE_LABELS[key]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Default"}
              </button>
              {saveStatus ? (
                <span className="text-xs text-slate-500">{saveStatus}</span>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleToggle}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 hover:border-slate-300"
          >
            {isPreview ? "Exit Preview" : "Preview Templates"}
          </button>
        </div>
      </div>
    </div>
  );
}
