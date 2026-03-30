"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ClaimRequestStatusResponse,
  type ClaimSetupAssetStatus,
  type ClaimSetupDomainStatus,
  type ClaimSetupExternalStatus,
  type ClaimSetupIntakeSummary,
  type ClaimSetupPosStatus,
  submitClaimSetupIntake,
} from "@/lib/claim";

type LaunchSetupIntakeProps = {
  claimRequestId: string;
  accessToken: string;
  claim: ClaimRequestStatusResponse;
};

type FormState = {
  preferredContactMethod: ClaimRequestStatusResponse["preferredContactMethod"];
  hoursFulfillmentNotes: string;
  googleBusinessProfileStatus: ClaimSetupExternalStatus;
  yelpStatus: ClaimSetupExternalStatus;
  domainStatus: ClaimSetupDomainStatus;
  logoPhotosStatus: ClaimSetupAssetStatus;
  posPaymentStatus: ClaimSetupPosStatus;
  setupNotes: string;
};

const SUPPORT_PHONE = "+18183420990";
const SUPPORT_WHATSAPP = "https://wa.me/18183420990";

const externalStatusOptions: Array<{
  value: ClaimSetupExternalStatus;
  label: string;
  detail: string;
}> = [
  { value: "ready", label: "Ready", detail: "You have access and can update it." },
  { value: "need_help", label: "Need help", detail: "You want help handling it." },
  { value: "not_sure", label: "Not sure", detail: "You are unsure who owns or manages it." },
];

const domainStatusOptions: Array<{
  value: ClaimSetupDomainStatus;
  label: string;
  detail: string;
}> = [
  { value: "have_access", label: "I have access", detail: "You can sign in or share access." },
  { value: "need_help", label: "Need help", detail: "You want help finding or updating it." },
  { value: "no_domain_yet", label: "No domain yet", detail: "Launch on the managed URL first." },
  { value: "not_sure", label: "Not sure", detail: "You are unsure who controls the domain." },
];

const assetStatusOptions: Array<{
  value: ClaimSetupAssetStatus;
  label: string;
  detail: string;
}> = [
  { value: "ready", label: "Ready", detail: "Logo and photos are ready to share." },
  { value: "partial", label: "Partial", detail: "You have some assets but not everything." },
  { value: "need_help", label: "Need help", detail: "Support should work with what is available." },
];

const posStatusOptions: Array<{
  value: ClaimSetupPosStatus;
  label: string;
  detail: string;
}> = [
  { value: "ready", label: "Ready", detail: "You already know the setup details." },
  { value: "need_help", label: "Need help", detail: "You want to talk this through in kickoff." },
  { value: "not_applicable", label: "Not applicable", detail: "You do not need this for v1." },
  { value: "not_sure", label: "Not sure", detail: "You are unsure what matters yet." },
];

const contactOptions: Array<{
  value: ClaimRequestStatusResponse["preferredContactMethod"];
  label: string;
}> = [
  { value: "call", label: "Call" },
  { value: "text", label: "Text" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

function buildInitialState(claim: ClaimRequestStatusResponse): FormState {
  const summary = claim.setupIntakeSummary;
  return {
    preferredContactMethod: summary?.preferredContactMethod || claim.preferredContactMethod,
    hoursFulfillmentNotes: summary?.hoursFulfillmentNotes || "",
    googleBusinessProfileStatus: summary?.googleBusinessProfileStatus || "not_sure",
    yelpStatus: summary?.yelpStatus || "not_sure",
    domainStatus: summary?.domainStatus || "not_sure",
    logoPhotosStatus: summary?.logoPhotosStatus || "partial",
    posPaymentStatus: summary?.posPaymentStatus || "not_sure",
    setupNotes: summary?.setupNotes || "",
  };
}

function valueLabel(value: string) {
  switch (value) {
    case "ready":
      return "Ready";
    case "need_help":
      return "Need help";
    case "not_sure":
      return "Not sure";
    case "have_access":
      return "Have access";
    case "no_domain_yet":
      return "No domain yet";
    case "partial":
      return "Partial";
    case "not_applicable":
      return "Not applicable";
    case "call":
      return "Call";
    case "text":
      return "Text";
    case "whatsapp":
      return "WhatsApp";
    case "email":
      return "Email";
    default:
      return value.replace(/_/g, " ");
  }
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="rounded-2xl border border-[#eadccf] bg-[#fffaf5] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">{value}</p>
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (next: T) => void;
  options: Array<{ value: T; label: string; detail: string }>;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} — {option.detail}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LaunchSetupIntake({
  claimRequestId,
  accessToken,
  claim,
}: LaunchSetupIntakeProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialState(claim));
  const [savedSummary, setSavedSummary] = useState<ClaimSetupIntakeSummary | null>(
    claim.setupIntakeSummary
  );
  const [submittedAt, setSubmittedAt] = useState<string | null>(claim.setupIntakeSubmittedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSavedSummary = Boolean(savedSummary && submittedAt);
  const submittedLabel = useMemo(() => {
    if (!submittedAt) return null;
    const value = new Date(submittedAt);
    if (Number.isNaN(value.getTime())) return null;
    return value.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [submittedAt]);

  useEffect(() => {
    setSavedSummary(claim.setupIntakeSummary);
    setSubmittedAt(claim.setupIntakeSubmittedAt);
    setForm(buildInitialState(claim));
  }, [claim]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const next = await submitClaimSetupIntake(claimRequestId, {
        accessToken,
        preferredContactMethod: form.preferredContactMethod,
        hoursFulfillmentNotes: form.hoursFulfillmentNotes.trim() || null,
        googleBusinessProfileStatus: form.googleBusinessProfileStatus,
        yelpStatus: form.yelpStatus,
        domainStatus: form.domainStatus,
        logoPhotosStatus: form.logoPhotosStatus,
        posPaymentStatus: form.posPaymentStatus,
        setupNotes: form.setupNotes.trim() || null,
      });
      setSavedSummary(next.setupIntakeSummary);
      setSubmittedAt(next.setupIntakeSubmittedAt);
      startTransition(() => {
        router.refresh();
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "We could not save your kickoff details yet."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b04a2d]">
            Setup Intake
          </p>
          <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">
            Help us prep kickoff before support reaches out
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#665b52]">
            Share the basics once here so support is not starting from scratch in WhatsApp. We
            launch on your managed Chinese Takeout URL first, and the $99/month plan does not
            start until your site is live.
          </p>
        </div>
        <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] px-4 py-3 text-sm text-[#6b5543]">
          <p className="font-semibold text-[#1f1f1f]">Need a human instead?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="rounded-xl border border-[#ddc7b5] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff3ea]"
            >
              Call Support
            </a>
            <a
              href={SUPPORT_WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#ddc7b5] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff3ea]"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </div>

      {hasSavedSummary && savedSummary ? (
        <div className="mt-6 rounded-3xl border border-[#d8ead8] bg-[#f7fcf7] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f6b39]">
                Setup Intake Saved
              </p>
              <h3 className="mt-2 text-2xl font-bold text-[#1f1f1f]">
                Support will use this in kickoff
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#4f5d51]">
                You do not need to resend these details unless something changes. The launch team
                will use this summary to keep kickoff focused and move faster.
              </p>
            </div>
            {submittedLabel ? (
              <span className="rounded-full border border-[#cfe1ca] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#2f6b39]">
                Saved {submittedLabel}
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <SummaryItem
              label="Preferred Contact"
              value={valueLabel(savedSummary.preferredContactMethod)}
            />
            <SummaryItem
              label="Google Business Profile"
              value={valueLabel(savedSummary.googleBusinessProfileStatus)}
            />
            <SummaryItem label="Yelp" value={valueLabel(savedSummary.yelpStatus)} />
            <SummaryItem label="Domain" value={valueLabel(savedSummary.domainStatus)} />
            <SummaryItem
              label="Logo / Photos"
              value={valueLabel(savedSummary.logoPhotosStatus)}
            />
            <SummaryItem
              label="POS / Payment / Printer"
              value={valueLabel(savedSummary.posPaymentStatus)}
            />
          </div>

          {savedSummary.hoursFulfillmentNotes ? (
            <div className="mt-4 rounded-2xl border border-[#d7e7d3] bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7f69]">
                Hours + Fulfillment Notes
              </p>
              <p className="mt-2 text-sm leading-6 text-[#42533f]">
                {savedSummary.hoursFulfillmentNotes}
              </p>
            </div>
          ) : null}

          {savedSummary.setupNotes ? (
            <div className="mt-4 rounded-2xl border border-[#d7e7d3] bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7f69]">
                Extra Setup Notes
              </p>
              <p className="mt-2 text-sm leading-6 text-[#42533f]">{savedSummary.setupNotes}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Preferred Contact
              </span>
              <select
                value={form.preferredContactMethod}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    preferredContactMethod: event.target.value as FormState["preferredContactMethod"],
                  }))
                }
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
              >
                {contactOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Hours + Fulfillment Notes
              </span>
              <textarea
                value={form.hoursFulfillmentNotes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    hoursFulfillmentNotes: event.target.value,
                  }))
                }
                rows={5}
                placeholder="Share current hours, pickup or delivery details, and anything support should know before kickoff."
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Google Business Profile"
              value={form.googleBusinessProfileStatus}
              onChange={(next) =>
                setForm((current) => ({ ...current, googleBusinessProfileStatus: next }))
              }
              options={externalStatusOptions}
            />
            <SelectField
              label="Yelp"
              value={form.yelpStatus}
              onChange={(next) => setForm((current) => ({ ...current, yelpStatus: next }))}
              options={externalStatusOptions}
            />
            <SelectField
              label="Domain"
              value={form.domainStatus}
              onChange={(next) => setForm((current) => ({ ...current, domainStatus: next }))}
              options={domainStatusOptions}
            />
            <SelectField
              label="Logo + Photos"
              value={form.logoPhotosStatus}
              onChange={(next) => setForm((current) => ({ ...current, logoPhotosStatus: next }))}
              options={assetStatusOptions}
            />
            <SelectField
              label="POS / Payment / Printer"
              value={form.posPaymentStatus}
              onChange={(next) => setForm((current) => ({ ...current, posPaymentStatus: next }))}
              options={posStatusOptions}
            />
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Extra Setup Notes
              </span>
              <textarea
                value={form.setupNotes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    setupNotes: event.target.value,
                  }))
                }
                rows={5}
                placeholder="Anything else the launch team should know before kickoff?"
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4 text-sm leading-6 text-[#665b52]">
            Managed launch URL first: we launch your site on the Chinese Takeout URL for now so
            you can start sharing immediately. Custom domains can come later. Monthly billing stays
            pending until the site is actually live.
          </div>

          {error ? (
            <p className="rounded-2xl border border-[#f3c8bb] bg-[#fff4ef] px-4 py-3 text-sm text-[#9e3f28]">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ad3324] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving kickoff details..." : "Save Setup Details"}
            </button>
            <a
              href={SUPPORT_WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
            >
              Send Notes on WhatsApp Instead
            </a>
          </div>
        </form>
      )}
    </section>
  );
}
