"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  BUYER_TEMPLATE_KEYS,
  DEFAULT_TEMPLATE_KEY,
  OPERATOR_TEMPLATE_KEYS,
  TEMPLATE_KEYS,
  TEMPLATE_LABELS,
  TEMPLATE_PROFILES,
  isBuyerTemplateKey,
  isDeployableTemplateKey,
  isOperatorTemplateKey,
  isTemplateKey,
  type TemplateKey,
} from "@/components/restaurant-templates/types";
import {
  FONT_PRESET_KEYS,
  FONT_PRESET_LABELS,
  PALETTE_KEYS,
  PALETTE_LABELS,
  resolveFontPreset,
  resolvePalette,
  type FontPresetKey,
  type PaletteKey,
} from "@/components/restaurant-templates/preview-options";
import { trackEvent } from "@/lib/analytics";
import { buildClaimHref } from "@/lib/claim";

type TemplatePreviewToggleProps = {
  basePath: string;
  current: TemplateKey;
  stateSlug: string;
  citySlug: string;
  restaurantSlug: string;
  canSaveDefault: boolean;
  currentFont: FontPresetKey;
  currentPalette: PaletteKey;
};

export function TemplatePreviewToggle({
  basePath,
  current,
  stateSlug,
  citySlug,
  restaurantSlug,
  canSaveDefault,
  currentFont,
  currentPalette,
}: TemplatePreviewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const isPreview = searchParams.get("preview") === "1";
  const templateParam = searchParams.get("template") as TemplateKey | null;
  const activeTemplate =
    templateParam && isTemplateKey(templateParam) ? templateParam : current;
  const activeFont = resolveFontPreset(searchParams.get("font") ?? currentFont);
  const activePalette = resolvePalette(
    searchParams.get("palette") ?? currentPalette
  );
  const activeBuyerTemplate = isBuyerTemplateKey(activeTemplate)
    ? activeTemplate
    : DEFAULT_TEMPLATE_KEY;
  const isOperatorLaneTemplate = isOperatorTemplateKey(activeTemplate);
  const activeTemplateLabel = TEMPLATE_LABELS[activeTemplate];
  const activeTemplateProfile = TEMPLATE_PROFILES[activeTemplate];
  const isLegacyConceptTemplate =
    !isBuyerTemplateKey(activeTemplate) && !isOperatorLaneTemplate;
  const canSaveActiveTemplate = canSaveDefault && isDeployableTemplateKey(activeTemplate);
  const previewTemplateKeys: readonly TemplateKey[] = TEMPLATE_KEYS;
  const previewSelectedTemplate = previewTemplateKeys.includes(activeTemplate as TemplateKey)
    ? activeTemplate
    : activeBuyerTemplate;
  const claimHref = buildClaimHref({
    stateSlug,
    citySlug,
    restaurantSlug,
    templateKey: activeBuyerTemplate,
  });

  function buildUrl(
    nextPreview: boolean,
    nextTemplate?: TemplateKey,
    nextFont?: FontPresetKey,
    nextPalette?: PaletteKey
  ) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPreview) {
      params.set("preview", "1");
      params.set("template", nextTemplate ?? activeBuyerTemplate);
      params.set("font", nextFont ?? activeFont);
      params.set("palette", nextPalette ?? activePalette);
      params.delete("viewport");
      params.delete("compare");
    } else {
      params.delete("preview");
      params.delete("template");
      params.delete("font");
      params.delete("palette");
      params.delete("viewport");
      params.delete("compare");
    }
    const query = params.toString();
    const target = basePath || pathname;
    return query ? `${target}?${query}` : target;
  }

  function handleToggle() {
    trackEvent("template_preview_toggle", {
      enabled: !isPreview,
      state_slug: stateSlug,
      city_slug: citySlug,
      restaurant_slug: restaurantSlug,
    });
    router.push(buildUrl(!isPreview));
  }

  function handleTemplateChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as TemplateKey;
    setSaveStatus(null);
    trackEvent("template_change", {
      template: value,
      state_slug: stateSlug,
      city_slug: citySlug,
      restaurant_slug: restaurantSlug,
    });
    router.push(buildUrl(true, value, activeFont, activePalette));
  }

  function handleTemplatePick(value: TemplateKey) {
    setSaveStatus(null);
    trackEvent("template_change", {
      template: value,
      source: "template_showroom_card",
      state_slug: stateSlug,
      city_slug: citySlug,
      restaurant_slug: restaurantSlug,
    });
    router.push(buildUrl(true, value, activeFont, activePalette));
  }

  function handleFontChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as FontPresetKey;
    router.push(buildUrl(true, activeTemplate, value, activePalette));
  }

  function handlePaletteChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as PaletteKey;
    router.push(buildUrl(true, activeTemplate, activeFont, value));
  }

  async function handleSaveTemplate() {
    if (!canSaveDefault) {
      setSaveStatus("Save disabled: set ADMIN_TOKEN for web/api and restart.");
      return;
    }
    if (!isDeployableTemplateKey(activeTemplate)) {
      setSaveStatus("Save disabled: archived concepts cannot be public defaults.");
      return;
    }

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
        const text = await response.text();
        let detail = text;
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed.detail === "string") {
            detail = parsed.detail;
          }
        } catch {
          // Keep text detail when response is not JSON.
        }
        throw new Error(detail || "Failed to save template");
      }
      setSaveStatus("Saved");
      trackEvent("template_save", {
        template: activeTemplate,
        state_slug: stateSlug,
        city_slug: citySlug,
        restaurant_slug: restaurantSlug,
      });
      router.push(basePath);
    } catch (error) {
      if (error instanceof Error && error.message.trim()) {
        setSaveStatus(`Save failed: ${error.message.slice(0, 120)}`);
      } else {
        setSaveStatus("Save failed");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1760px] px-6 pt-6">
      <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Template Preview
          </p>
          <p className="text-sm text-slate-600">
            {isPreview
              ? isLegacyConceptTemplate
                ? "Preview mode is on. You're looking at an archived Ming concept. Standard owner-facing options now focus on Local Order, Storefront, and Express."
                : isOperatorLaneTemplate
                  ? `Preview mode is on. You're looking at ${activeTemplateLabel}, a specialized operator lane. Standard owner-facing options are Local Order, Storefront, and Express.`
                  : "Preview mode is on. Local Order covers the safest default, Storefront leads with brand presence, and Express gives the fastest phone-first order flow."
              : "Preview the three owner-facing templates first. Specialized operator lanes and archived concepts stay available only through direct preview links."}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {isPreview ? (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Choose
              </label>
              <select
                value={previewSelectedTemplate}
                onChange={handleTemplateChange}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {previewTemplateKeys.map((key) => (
                  <option key={key} value={key}>
                    {TEMPLATE_LABELS[key]}
                  </option>
                ))}
              </select>
              <select
                value={activeFont}
                onChange={handleFontChange}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {FONT_PRESET_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {FONT_PRESET_LABELS[key]}
                  </option>
                ))}
              </select>
              <select
                value={activePalette}
                onChange={handlePaletteChange}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {PALETTE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {PALETTE_LABELS[key]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={isSaving || !canSaveActiveTemplate}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Default"}
              </button>
              {!canSaveDefault ? (
                <span className="text-xs text-amber-700">
                  Set ADMIN_TOKEN to enable saving.
                </span>
              ) : !isDeployableTemplateKey(activeTemplate) ? (
                <span className="text-xs text-amber-700">
                  Archived concepts cannot be saved as the public default.
                </span>
              ) : null}
              {saveStatus ? (
                <span className="text-xs text-slate-500">{saveStatus}</span>
              ) : null}
            </div>
          ) : null}
          {isPreview ? (
            <a
              href={claimHref}
              data-analytics-event="claim_cta_click"
              data-analytics-payload={JSON.stringify({
                source: "listing_template_toggle",
                state_slug: stateSlug,
                city_slug: citySlug,
                restaurant_slug: restaurantSlug,
                template_key: activeBuyerTemplate,
              })}
              className="rounded-full border border-[#e3d2c5] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d5848] hover:border-[#d5b9a6] hover:bg-[#fff8f2]"
            >
              {isBuyerTemplateKey(activeTemplate)
                ? "Use This Template in Claim"
                : `Use ${TEMPLATE_LABELS[activeBuyerTemplate]} in Claim`}
            </a>
          ) : null}
          <button
            type="button"
            onClick={handleToggle}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 hover:border-slate-300"
          >
            {isPreview ? "Exit Preview" : "Preview Templates"}
          </button>
        </div>

        {isPreview ? (
          <div className="mt-4 space-y-3">
            {isLegacyConceptTemplate ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                You&apos;re previewing an archived Ming concept. Buyer-facing launch choices are now
                Local Order, Storefront, and Express.
              </p>
            ) : isOperatorLaneTemplate ? (
              <p className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-900">
                {activeTemplateLabel} is an operator-recommended lane. We keep it available when it
                clearly fits the restaurant, but standard owner-facing choices remain Local Order,
                Storefront, and Express.
              </p>
            ) : null}
            <div
              className={`grid gap-2 ${
                previewTemplateKeys.length > 3
                  ? "md:grid-cols-2 xl:grid-cols-4"
                  : previewTemplateKeys.length > 2
                    ? "md:grid-cols-3"
                    : "md:grid-cols-2"
              }`}
            >
              {previewTemplateKeys.map((key) => {
                const selected = key === activeTemplate;
                const profile = TEMPLATE_PROFILES[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTemplatePick(key)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      selected
                        ? "border-[#cf4333] bg-[#fff4ef]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {profile.stage}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                          key === "local-order"
                            ? "bg-[#ffe8e1] text-[#ab3328]"
                          : key === "local-express"
                              ? "bg-[#fff1e8] text-[#a64d21]"
                              : key === "local-feast"
                                ? "bg-[#fff2ea] text-[#9a4520]"
                              : key === "metro-grid"
                                ? "bg-[#e9f2ff] text-[#275aa8]"
                              : key === "glass-orbit"
                                ? "bg-[#e8f9ff] text-[#13708b]"
                            : "bg-[#f6efe7] text-[#7a5f4a]"
                        }`}
                      >
                        {profile.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {TEMPLATE_LABELS[key]}
                    </p>
                    <p className="mt-1 text-xs text-slate-700">{profile.headline}</p>
                    <p className="mt-1 text-xs text-slate-600">{profile.bestFor}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Active Template
                </p>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {TEMPLATE_PROFILES[activeTemplate].stage}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {activeTemplateLabel}
              </p>
              <p className="text-xs font-medium text-slate-700">
                {activeTemplateProfile.headline}
              </p>
              <p className="mt-1 text-xs text-slate-600">{activeTemplateProfile.bestFor}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {activeTemplateProfile.fitTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {activeTemplateProfile.strengths.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                Focus points: {activeTemplateProfile.focusPoints}.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
