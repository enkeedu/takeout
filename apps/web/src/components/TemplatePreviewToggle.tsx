"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  TEMPLATE_KEYS,
  TEMPLATE_LABELS,
  type TemplateKey,
} from "@/components/restaurant-templates/types";
import {
  FONT_PRESET_KEYS,
  FONT_PRESET_LABELS,
  PALETTE_KEYS,
  PALETTE_LABELS,
  type FontPresetKey,
  type PaletteKey,
} from "@/components/restaurant-templates/preview-options";

type TemplatePreviewToggleProps = {
  basePath: string;
  current: TemplateKey;
  currentFont: FontPresetKey;
  currentPalette: PaletteKey;
};

export function TemplatePreviewToggle({
  basePath,
  current,
  currentFont,
  currentPalette,
}: TemplatePreviewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const templateParam = searchParams.get("template") as TemplateKey | null;
  const fontParam = searchParams.get("font") as FontPresetKey | null;
  const paletteParam = searchParams.get("palette") as PaletteKey | null;
  const activeTemplate =
    templateParam && TEMPLATE_KEYS.includes(templateParam)
      ? templateParam
      : current;
  const activeFont =
    fontParam && FONT_PRESET_KEYS.includes(fontParam) ? fontParam : currentFont;
  const activePalette =
    paletteParam && PALETTE_KEYS.includes(paletteParam)
      ? paletteParam
      : currentPalette;
  const [draftTemplate, setDraftTemplate] = useState(activeTemplate);
  const [draftFont, setDraftFont] = useState(activeFont);
  const [draftPalette, setDraftPalette] = useState(activePalette);

  useEffect(() => {
    setDraftTemplate(activeTemplate);
    setDraftFont(activeFont);
    setDraftPalette(activePalette);
  }, [activeTemplate, activeFont, activePalette]);

  function buildUrl(
    nextTemplate: TemplateKey,
    nextFont: FontPresetKey,
    nextPalette: PaletteKey
  ) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("template", nextTemplate);
    params.set("font", nextFont);
    params.set("palette", nextPalette);
    const query = params.toString();
    const target = basePath || pathname;
    return query ? `${target}?${query}` : target;
  }

  function applySelections(
    nextTemplate: TemplateKey,
    nextFont: FontPresetKey,
    nextPalette: PaletteKey
  ) {
    startTransition(() => {
      router.replace(buildUrl(nextTemplate, nextFont, nextPalette), {
        scroll: false,
      });
    });
  }

  function handleTemplateChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as TemplateKey;
    setDraftTemplate(value);
    applySelections(value, draftFont, draftPalette);
  }

  function handleFontChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as FontPresetKey;
    setDraftFont(value);
    applySelections(draftTemplate, value, draftPalette);
  }

  function handlePaletteChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as PaletteKey;
    setDraftPalette(value);
    applySelections(draftTemplate, draftFont, value);
  }

  return (
    <div className="mx-auto w-full max-w-[1760px] px-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Template Controls
          </p>
          <p className="text-sm text-slate-600">
            Style updates apply instantly as you change template, font, and theme.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">
            <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:min-w-[220px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Template
              </span>
              <select
                value={draftTemplate}
                onChange={handleTemplateChange}
                className="w-[130px] rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {TEMPLATE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {TEMPLATE_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:min-w-[220px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Font
              </span>
              <select
                value={draftFont}
                onChange={handleFontChange}
                className="w-[130px] rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {FONT_PRESET_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {FONT_PRESET_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:min-w-[220px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Theme
              </span>
              <select
                value={draftPalette}
                onChange={handlePaletteChange}
                className="w-[130px] rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {PALETTE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {PALETTE_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-3">
            {isPending ? (
              <span className="text-xs font-medium text-slate-500">Applying...</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
