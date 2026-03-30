"use client";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import {
  buildLaunchStatusHref,
  submitClaimReviewDecision,
  type ClaimReviewIssueArea,
} from "@/lib/claim";

const SUPPORT_PHONE = "+18183420990";
const SUPPORT_WHATSAPP = "https://wa.me/18183420990";

const REVIEW_CHECKLIST = [
  "Branding, logo, and photos",
  "Menu items and pricing",
  "Hours, phone, and address",
  "Pickup, delivery, and ordering flow",
  "Final links and guest-facing CTA",
];

const ISSUE_AREA_OPTIONS: Array<{ key: ClaimReviewIssueArea; label: string }> = [
  { key: "branding_photos", label: "Branding, logo, or photos" },
  { key: "menu_pricing", label: "Menu items or pricing" },
  { key: "hours_contact", label: "Hours, phone, or address" },
  { key: "fulfillment_ordering", label: "Pickup, delivery, or ordering flow" },
  { key: "links_cta", label: "Links or guest-facing CTA" },
];

function errorText(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.detail.trim()) return error.detail.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
}

type ActivePanel = "approve" | "changes" | null;

type LaunchReviewCenterProps = {
  claimRequestId: string;
  accessToken: string;
  restaurantName: string;
  templateLabel: string;
  previewHref: string;
  embeddedPreviewHref: string;
};

export function LaunchReviewCenter({
  claimRequestId,
  accessToken,
  restaurantName,
  templateLabel,
  previewHref,
  embeddedPreviewHref,
}: LaunchReviewCenterProps) {
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueAreas, setIssueAreas] = useState<ClaimReviewIssueArea[]>([]);
  const [notes, setNotes] = useState("");

  function toggleIssueArea(issueArea: ClaimReviewIssueArea) {
    setIssueAreas((current) =>
      current.includes(issueArea)
        ? current.filter((value) => value !== issueArea)
        : [...current, issueArea]
    );
  }

  async function handleSubmit(decision: "approved" | "changes_requested") {
    if (busy) return;
    if (decision === "changes_requested" && !issueAreas.length && !notes.trim()) {
      setError("Pick at least one area to update or leave a short note for the team.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await submitClaimReviewDecision(claimRequestId, {
        accessToken,
        decision,
        issueAreas: decision === "changes_requested" ? issueAreas : undefined,
        notes: decision === "changes_requested" ? notes.trim() || null : null,
      });
      const href = buildLaunchStatusHref(claimRequestId, accessToken, {
        fresh: "1",
        mode: decision === "approved" ? "review-approved" : "review-changes",
      });
      window.location.assign(href);
    } catch (nextError) {
      setError(
        errorText(
          nextError,
          decision === "approved"
            ? "We could not save your approval right now. Try again or contact support."
            : "We could not save your requested changes right now. Try again or contact support."
        )
      );
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_340px]">
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-4 rounded-[28px] bg-[#f0c9b5]/35 blur-3xl"
          />
          <div className="relative overflow-hidden rounded-[24px] border border-[#dacbbb] bg-[#f4eee4] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <div
              aria-busy={!previewLoaded}
              className="relative h-[420px] bg-[#f5ecdf] md:h-[600px]"
            >
              <div className="pointer-events-none absolute inset-x-5 top-5 z-10 flex items-center justify-between gap-3 rounded-full border border-white/70 bg-white/78 px-4 py-2 backdrop-blur">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b7361]">
                    Owner Review Preview
                  </p>
                  <p className="text-xs text-[#5f544b]">
                    Final pass before we move this build into launch.
                  </p>
                </div>
                <span className="rounded-full bg-[#fff1eb] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ab3328]">
                  {templateLabel}
                </span>
              </div>
              {!previewLoaded ? (
                <div className="absolute inset-0 z-10 flex flex-col justify-end bg-[linear-gradient(180deg,rgba(247,242,234,0.97)_0%,rgba(245,236,223,0.9)_58%,rgba(241,228,213,0.98)_100%)] p-5">
                  <div className="mb-auto flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <div className="h-3 w-28 animate-pulse rounded-full bg-white/70" />
                      <div className="h-2.5 w-52 animate-pulse rounded-full bg-white/60" />
                    </div>
                    <div className="h-7 w-28 animate-pulse rounded-full bg-white/65" />
                  </div>
                  <div className="space-y-3 rounded-[20px] border border-white/50 bg-white/50 p-4 shadow-[0_18px_40px_rgba(72,35,11,0.08)] backdrop-blur-sm">
                    <div className="h-4 w-44 animate-pulse rounded-full bg-white/70" />
                    <div className="h-28 animate-pulse rounded-[18px] bg-white/60" />
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="h-12 animate-pulse rounded-2xl bg-white/55" />
                      <div className="h-12 animate-pulse rounded-2xl bg-white/50" />
                      <div className="h-12 animate-pulse rounded-2xl bg-white/45" />
                    </div>
                  </div>
                </div>
              ) : null}
              <iframe
                key={embeddedPreviewHref}
                title={`${restaurantName} preview`}
                src={embeddedPreviewHref}
                onLoad={() => setPreviewLoaded(true)}
                className={`pointer-events-none absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${
                  previewLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f4eee4] via-[#f4eee400] to-transparent" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-[24px] border border-[#eadccf] bg-white/90 p-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b04a2d]">
                Owner Review
              </p>
              <h2 className="font-[var(--font-display)] mt-2 text-3xl font-black tracking-tight text-[#1f1f1f]">
                Review your website before launch
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#665b52]">
                This is the polished build for {restaurantName}. Check the preview, confirm the
                details, then either approve it for launch or send back the last edits.
              </p>
            </div>

            <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                What To Review
              </p>
              <ul className="mt-4 space-y-3">
                {REVIEW_CHECKLIST.map((item, index) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#4f463f]">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#eadccf] bg-white text-xs font-bold text-[#ab3328]">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setActivePanel("approve");
                  setError(null);
                }}
                disabled={busy}
                className="rounded-xl bg-[#c73f2f] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ad3324] disabled:opacity-60"
              >
                Approve for Launch
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePanel("changes");
                  setError(null);
                }}
                disabled={busy}
                className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2] disabled:opacity-60"
              >
                Request Changes
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={previewHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2]"
              >
                Open Full Preview
              </a>
              <a
                href={SUPPORT_WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2]"
              >
                WhatsApp Support
              </a>
              <a
                href={`tel:${SUPPORT_PHONE}`}
                className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2]"
              >
                Call Support
              </a>
            </div>
          </div>

          {activePanel === "approve" ? (
            <div className="rounded-2xl border border-[#d7e7d3] bg-[#f7fcf7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f6b39]">
                Final Approval
              </p>
              <p className="mt-2 text-sm leading-6 text-[#42533f]">
                Approving here tells the team the build looks good and can move into final launch
                checks. The site will not go live until those checks are finished.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmit("approved")}
                  disabled={busy}
                  className="rounded-xl bg-[#2f6b39] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#25572d] disabled:opacity-60"
                >
                  {busy ? "Saving Approval..." : "Send Approval"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!busy) setActivePanel(null);
                  }}
                  disabled={busy}
                  className="rounded-xl border border-[#cfdcc9] bg-white px-4 py-3 text-sm font-semibold text-[#42533f] transition-colors hover:bg-[#f6fbf4] disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {activePanel === "changes" ? (
            <div className="rounded-2xl border border-[#eadccf] bg-[#fffaf5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Requested Changes
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5d544c]">
                Pick the areas that still need work and leave a note if there is anything specific
                the team should change before launch.
              </p>

              <div className="mt-4 grid gap-2">
                {ISSUE_AREA_OPTIONS.map((option) => {
                  const selected = issueAreas.includes(option.key);
                  return (
                    <label
                      key={option.key}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition-colors ${
                        selected
                          ? "border-[#cf4333] bg-[#fff4ef] text-[#6a392b]"
                          : "border-[#eadccf] bg-white text-[#5d544c] hover:bg-[#fff8f2]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleIssueArea(option.key)}
                        className="mt-1 h-4 w-4 rounded border-[#d5b8a3] text-[#c73f2f] focus:ring-[#c73f2f]"
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                  Notes
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Example: the lunch specials need updated prices and the phone number in the header should match the listed business phone."
                  className="mt-2 w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition-colors placeholder:text-[#9c8d81] focus:border-[#c73f2f]"
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmit("changes_requested")}
                  disabled={busy}
                  className="rounded-xl bg-[#c73f2f] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ad3324] disabled:opacity-60"
                >
                  {busy ? "Saving Changes..." : "Send Change Request"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!busy) setActivePanel(null);
                  }}
                  disabled={busy}
                  className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2] disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-[#f2d1c8] bg-[#fff4ef] px-4 py-3 text-sm text-[#9e3f28]">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
