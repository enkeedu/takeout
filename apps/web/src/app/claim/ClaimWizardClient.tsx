"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { OwnerSetupExpectations } from "@/components/OwnerSetupExpectations";
import {
  BUYER_TEMPLATE_KEYS,
  TEMPLATE_LABELS,
  TEMPLATE_PROFILES,
} from "@/components/restaurant-templates/types";
import {
  buildClaimHref,
  buildLaunchStatusHref,
  buildListingHref,
  buildOwnerWorkspaceHref,
  sendClaimCode,
  submitClaimManualReview,
  submitClaimRequest,
  type ClaimTemplateChoice,
  type PreferredContactMethod,
  verifyClaimCode,
} from "@/lib/claim";
import {
  buildClaimDraftKey,
  clearClaimDraft,
  loadClaimDraft,
  saveClaimDraft,
  type ClaimDraftV2,
  type ClaimVerificationDraft,
} from "@/lib/claimDraft";

type ClaimWizardClientProps = {
  stateSlug: string;
  citySlug: string;
  restaurantSlug: string;
  restaurantName: string;
  addressLine: string;
  phone: string | null;
  templateKey: ClaimTemplateChoice;
  templateSource: "query" | "legacy" | "default";
  menuCategoryCount: number;
  menuItemCount: number;
  hasHours: boolean;
};

type CompletionMode = "claim_submitted" | "manual_review" | null;
type TemplateOption = {
  key: ClaimTemplateChoice;
  label: string;
  badge: string;
  detail: string;
  bestFor: string;
  strengths: string[];
  focusPoints: string;
  fitTags: string[];
};

const TEMPLATE_OPTIONS: TemplateOption[] = [
  ...BUYER_TEMPLATE_KEYS.map((key) => ({
    key,
    label: TEMPLATE_LABELS[key],
    badge: TEMPLATE_PROFILES[key].badge,
    detail: TEMPLATE_PROFILES[key].headline,
    bestFor: TEMPLATE_PROFILES[key].bestFor,
    strengths: TEMPLATE_PROFILES[key].strengths,
    focusPoints: TEMPLATE_PROFILES[key].focusPoints,
    fitTags: TEMPLATE_PROFILES[key].fitTags,
  })),
];

const CONTACT_OPTIONS: Array<[PreferredContactMethod, string]> = [
  ["call", "Call"],
  ["text", "Text"],
  ["whatsapp", "WhatsApp"],
  ["email", "Email"],
];

const PROCESS_STRIP = ["Preview", "Verify", "Confirm", "Website ready in 5-7 days"] as const;
const POST_VERIFY_STEPS = ["Owner Contact", "Confirm Website Details", "Finalize Setup"] as const;

function labelSavedAt(iso: string | null) {
  if (!iso) return "Draft not saved yet";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Draft saved";
  return `Draft saved at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string) {
  return value.replace(/\D/g, "").length >= 7;
}

function normalizeVerification(
  verification: ClaimVerificationDraft | null | undefined
): ClaimVerificationDraft | null {
  if (!verification?.verified_token || !verification.verified_token_expires_at) return null;
  const expiresAt = new Date(verification.verified_token_expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) return null;
  return verification;
}

function errorText(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.detail.trim()) return error.detail.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
}

function focusSection(target: HTMLElement | null) {
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => {
    target.focus({ preventScroll: true });
  }, 120);
}

function Field({
  label,
  type = "text",
  value,
  placeholder,
  onChange,
  rows,
}: {
  label: string;
  type?: string;
  value: string;
  placeholder: string;
  onChange: (next: string) => void;
  rows?: number;
}) {
  const common =
    "w-full rounded-xl border border-[#d8c9bb] px-3 py-2 text-sm text-[#1f1f1f] focus:border-[#c73f2f] focus:outline-none focus:ring-2 focus:ring-[#f7d8cf]";
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7361]">
        {label}
      </span>
      {rows ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={common}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={common}
        />
      )}
    </label>
  );
}

export function ClaimWizardClient({
  stateSlug,
  citySlug,
  restaurantSlug,
  restaurantName,
  addressLine,
  phone,
  templateKey,
  templateSource,
  menuCategoryCount,
  menuItemCount,
  hasHours,
}: ClaimWizardClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ClaimTemplateChoice>(templateKey);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState(phone || "");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [preferredContact, setPreferredContact] = useState<PreferredContactMethod>("call");
  const [verifiedMenu, setVerifiedMenu] = useState(menuItemCount > 0);
  const [verifiedHours, setVerifiedHours] = useState(hasHours);
  const [launchReady, setLaunchReady] = useState(false);
  const [launchAgreementAccepted, setLaunchAgreementAccepted] = useState(false);
  const [verification, setVerification] = useState<ClaimVerificationDraft | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [manualReviewOpen, setManualReviewOpen] = useState(!phone);
  const [manualReviewReason, setManualReviewReason] = useState("");
  const [completed, setCompleted] = useState<CompletionMode>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [note, setNote] = useState<string | null>(phone ? null : "This listing does not show a text-capable business phone. Use manual review instead.");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [manualReviewError, setManualReviewError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sendBusy, setSendBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const hasTrackedClaimStart = useRef(false);
  const hasTrackedPreviewView = useRef(false);
  const previewHeadingRef = useRef<HTMLHeadingElement>(null);
  const verificationHeadingRef = useRef<HTMLHeadingElement>(null);
  const onboardingHeadingRef = useRef<HTMLHeadingElement>(null);

  const draftKey = useMemo(
    () => buildClaimDraftKey({ stateSlug, citySlug, restaurantSlug }),
    [stateSlug, citySlug, restaurantSlug]
  );
  const listingHref = useMemo(
    () => buildListingHref({ stateSlug, citySlug, restaurantSlug }),
    [stateSlug, citySlug, restaurantSlug]
  );
  const previewHref = `${listingHref}?preview=1&template=${encodeURIComponent(selectedTemplate)}`;
  const embeddedPreviewHref = `${previewHref}&claimPreview=1`;
  const selectedTemplateOption =
    TEMPLATE_OPTIONS.find((option) => option.key === selectedTemplate) || TEMPLATE_OPTIONS[0];

  const stepOneValid =
    ownerName.trim().length > 0 && isValidPhone(ownerPhone) && isValidEmail(ownerEmail);
  const canContinue =
    (step === 1 && stepOneValid) || (step === 2 && verifiedMenu && verifiedHours);
  const canSubmitClaim =
    Boolean(verification?.verified_token) &&
    stepOneValid &&
    verifiedMenu &&
    verifiedHours &&
    launchReady &&
    launchAgreementAccepted;
  const canSubmitManualReview = stepOneValid && manualReviewReason.trim().length > 0;

  useEffect(() => {
    setDraftReady(false);
    const draft = loadClaimDraft(draftKey);
    if (!draft) {
      setStep(1);
      setSelectedTemplate(templateKey);
      setOwnerName("");
      setOwnerPhone(phone || "");
      setOwnerEmail("");
      setPreferredContact("call");
      setVerifiedMenu(menuItemCount > 0);
      setVerifiedHours(hasHours);
      setLaunchReady(false);
      setLaunchAgreementAccepted(false);
      setVerification(null);
      setVerificationCode("");
      setManualReviewOpen(!phone);
      setManualReviewReason("");
      setCompleted(null);
      setLastSavedAt(null);
      setVerificationError(null);
      setManualReviewError(null);
      setSubmitError(null);
      setNote(phone ? null : "This listing does not show a text-capable business phone. Use manual review instead.");
      setDraftLoaded(false);
      setDraftReady(true);
      return;
    }

    const restoredVerification = normalizeVerification(draft.verification);
    setStep(
      restoredVerification
        ? Math.max(1, Math.min(POST_VERIFY_STEPS.length, draft.step))
        : 1
    );
    const restoredTemplate =
      templateSource === "default" && draft.selected_template
        ? draft.selected_template
        : templateKey;
    setSelectedTemplate(restoredTemplate);
    setOwnerName(draft.owner_name || "");
    setOwnerPhone(draft.owner_phone || phone || "");
    setOwnerEmail(draft.owner_email || "");
    setPreferredContact(draft.preferred_contact || "call");
    setVerifiedMenu(typeof draft.verified_menu === "boolean" ? draft.verified_menu : menuItemCount > 0);
    setVerifiedHours(typeof draft.verified_hours === "boolean" ? draft.verified_hours : hasHours);
    setLaunchReady(Boolean(draft.launch_ready));
    setLaunchAgreementAccepted(false);
    setVerification(restoredVerification);
    setVerificationCode("");
    setManualReviewOpen(!restoredVerification && !phone);
    setManualReviewReason("");
    setCompleted(null);
    setVerificationError(null);
    setManualReviewError(null);
    setSubmitError(null);
    setDraftLoaded(true);
    setLastSavedAt(draft.updated_at || null);
    setNote(
      restoredVerification
        ? `Business phone verified. Code went to ${restoredVerification.masked_phone || "the listed phone"}.`
        : phone
        ? null
        : "This listing does not show a text-capable business phone. Use manual review instead."
    );
    setDraftReady(true);
  }, [draftKey, hasHours, menuItemCount, phone, templateKey, templateSource]);

  useEffect(() => {
    if (!draftReady || completed) return;
    const timeout = window.setTimeout(() => {
      const updatedAt = new Date().toISOString();
      const draft: ClaimDraftV2 = {
        version: 2,
        state_slug: stateSlug,
        city_slug: citySlug,
        restaurant_slug: restaurantSlug,
        step,
        selected_template: selectedTemplate,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        owner_email: ownerEmail,
        preferred_contact: preferredContact,
        verified_identity: true,
        verified_contact: true,
        verified_menu: verifiedMenu,
        verified_hours: verifiedHours,
        launch_ready: launchReady,
        verification,
        updated_at: updatedAt,
      };
      saveClaimDraft(draftKey, draft);
      setLastSavedAt(updatedAt);
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [
    citySlug,
    completed,
    draftKey,
    draftReady,
    launchReady,
    ownerEmail,
    ownerName,
    ownerPhone,
    preferredContact,
    restaurantSlug,
    selectedTemplate,
    stateSlug,
    step,
    verification,
    verifiedHours,
    verifiedMenu,
  ]);

  useEffect(() => {
    if (!draftReady || typeof window === "undefined") return;
    const nextHref = buildClaimHref({
      stateSlug,
      citySlug,
      restaurantSlug,
      templateKey: selectedTemplate,
    });
    const currentHref = `${window.location.pathname}${window.location.search}`;
    if (currentHref !== nextHref) {
      window.history.replaceState({}, "", nextHref);
    }
  }, [citySlug, draftReady, restaurantSlug, selectedTemplate, stateSlug]);

  useEffect(() => {
    setPreviewLoaded(false);
  }, [embeddedPreviewHref]);

  useEffect(() => {
    if (!draftReady) return;
    if (hasTrackedClaimStart.current) return;
    hasTrackedClaimStart.current = true;
    trackEvent("claim_started", {
      source: "claim_page_load",
      state_slug: stateSlug,
      city_slug: citySlug,
      restaurant_slug: restaurantSlug,
      template_key: selectedTemplate,
    });
  }, [citySlug, draftReady, restaurantSlug, selectedTemplate, stateSlug]);

  useEffect(() => {
    if (!draftReady || hasTrackedPreviewView.current) return;
    hasTrackedPreviewView.current = true;
    trackEvent("claim_preview_viewed", {
      source: "claim_preview_showroom",
      state_slug: stateSlug,
      city_slug: citySlug,
      restaurant_slug: restaurantSlug,
      template_key: selectedTemplate,
    });
  }, [citySlug, draftReady, restaurantSlug, selectedTemplate, stateSlug]);

  function resetLocalState() {
    clearClaimDraft(draftKey);
    setStep(1);
    setSelectedTemplate(templateKey);
    setOwnerName("");
    setOwnerPhone(phone || "");
    setOwnerEmail("");
    setPreferredContact("call");
    setVerifiedMenu(menuItemCount > 0);
    setVerifiedHours(hasHours);
    setLaunchReady(false);
    setLaunchAgreementAccepted(false);
    setVerification(null);
    setVerificationCode("");
    setManualReviewOpen(!phone);
    setManualReviewReason("");
    setCompleted(null);
    setLastSavedAt(null);
    setNote(phone ? null : "This listing does not show a text-capable business phone. Use manual review instead.");
    setVerificationError(null);
    setManualReviewError(null);
    setSubmitError(null);
    setDraftLoaded(false);
  }

  function handleTemplateSelect(nextTemplate: ClaimTemplateChoice) {
    if (nextTemplate === selectedTemplate) return;
    setSelectedTemplate(nextTemplate);
    trackEvent("claim_template_selected", {
      source: "claim_preview_showroom",
      state_slug: stateSlug,
      city_slug: citySlug,
      restaurant_slug: restaurantSlug,
      template_key: nextTemplate,
    });
  }

  function handleUnlockClick() {
    trackEvent("claim_unlock_clicked", {
      source: "claim_preview_showroom",
      state_slug: stateSlug,
      city_slug: citySlug,
      restaurant_slug: restaurantSlug,
      template_key: selectedTemplate,
    });
    if (verification?.verified_token) {
      focusSection(onboardingHeadingRef.current);
      return;
    }
    focusSection(verificationHeadingRef.current);
  }

  function handleChangeDesign() {
    trackEvent("claim_change_design_clicked", {
      source: "claim_verified_flow",
      state_slug: stateSlug,
      city_slug: citySlug,
      restaurant_slug: restaurantSlug,
      template_key: selectedTemplate,
    });
    focusSection(previewHeadingRef.current);
  }

  async function handleSendCode() {
    setSendBusy(true);
    setVerificationError(null);
    setNote(null);
    try {
      const response = await sendClaimCode({ stateSlug, citySlug, restaurantSlug });
      setVerification({
        session_id: response.sessionId,
        masked_phone: response.maskedPhone,
        provider_mode: response.providerMode,
        verified_token: null,
        verified_token_expires_at: null,
        verified_at: null,
      });
      setManualReviewOpen(false);
      setVerificationCode("");
      setNote(
        response.providerMode === "mock"
          ? `Code sent to ${response.maskedPhone}. Local dev mode: enter 111111.`
          : `Code sent to ${response.maskedPhone}. Enter it below to unlock website editing.`
      );
      trackEvent("claim_verification_code_sent", {
        source: "claim_verification_gate",
        provider_mode: response.providerMode,
        state_slug: stateSlug,
        city_slug: citySlug,
        restaurant_slug: restaurantSlug,
      });
    } catch (error) {
      setVerificationError(errorText(error, "We could not send a verification code right now. Use manual review instead."));
      setManualReviewOpen(true);
    } finally {
      setSendBusy(false);
    }
  }

  async function handleVerifyCode() {
    if (!verification?.session_id || !verificationCode.trim()) return;
    setVerifyBusy(true);
    setVerificationError(null);
    try {
      const response = await verifyClaimCode({
        sessionId: verification.session_id,
        code: verificationCode.trim(),
      });
      setVerification({
        ...verification,
        verified_token: response.verifiedToken,
        verified_token_expires_at: new Date(Date.now() + response.expiresInSeconds * 1000).toISOString(),
        verified_at: new Date().toISOString(),
      });
      setVerificationCode("");
      setStep(1);
      setNote(`Business phone verified. You can finish setup for ${restaurantName} now.`);
      trackEvent("claim_verified", {
        source: "claim_verification_gate",
        state_slug: stateSlug,
        city_slug: citySlug,
        restaurant_slug: restaurantSlug,
        template_key: selectedTemplate,
      });
      window.setTimeout(() => {
        focusSection(onboardingHeadingRef.current);
      }, 160);
    } catch (error) {
      setVerificationError(errorText(error, "That code did not work. Try again or use manual review."));
    } finally {
      setVerifyBusy(false);
    }
  }

  async function handleManualReview() {
    if (!canSubmitManualReview) return;
    setManualBusy(true);
    setManualReviewError(null);
    try {
      const response = await submitClaimManualReview({
        stateSlug,
        citySlug,
        restaurantSlug,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerEmail: ownerEmail.trim(),
        preferredContactMethod: preferredContact,
        templateKey: selectedTemplate,
        reason: manualReviewReason.trim(),
      });
      clearClaimDraft(draftKey);
      setLastSavedAt(null);
      setCompleted("manual_review");
      trackEvent("claim_manual_review_requested", {
        source: "claim_manual_review",
        state_slug: stateSlug,
        city_slug: citySlug,
        restaurant_slug: restaurantSlug,
      });
      router.push(
        buildLaunchStatusHref(response.claimRequestId, response.launchAccessToken, {
          fresh: "1",
          mode: "manual-review",
        })
      );
    } catch (error) {
      setManualReviewError(errorText(error, "We could not submit the manual review request right now."));
    } finally {
      setManualBusy(false);
    }
  }

  async function handleSubmitClaim() {
    if (!canSubmitClaim || !verification?.verified_token) return;
    setSubmitBusy(true);
    setSubmitError(null);
    try {
      const response = await submitClaimRequest({
        verifiedToken: verification.verified_token,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerEmail: ownerEmail.trim(),
        preferredContactMethod: preferredContact,
        templateKey: selectedTemplate,
        menuConfirmed: verifiedMenu,
        hoursContactConfirmed: verifiedHours,
        launchTermsAccepted: launchAgreementAccepted,
      });
      trackEvent("claim_step_completed", {
        source: "claim_wizard",
        step: POST_VERIFY_STEPS.length,
        state_slug: stateSlug,
        city_slug: citySlug,
        restaurant_slug: restaurantSlug,
        template_key: selectedTemplate,
      });
      trackEvent("claim_submitted", {
        source: "claim_step_3",
        state_slug: stateSlug,
        city_slug: citySlug,
        restaurant_slug: restaurantSlug,
        template_key: selectedTemplate,
      });
      trackEvent("claim_ready_submitted", {
        source: "claim_step_3",
        state_slug: stateSlug,
        city_slug: citySlug,
        restaurant_slug: restaurantSlug,
        template_key: selectedTemplate,
      });
      trackEvent("claim_deposit_checkout_started", {
        source: "claim_step_3",
        state_slug: stateSlug,
        city_slug: citySlug,
        restaurant_slug: restaurantSlug,
        template_key: selectedTemplate,
      });
      clearClaimDraft(draftKey);
      setLastSavedAt(null);
      setCompleted("claim_submitted");
      router.push(
        buildOwnerWorkspaceHref(response.claimRequestId, response.launchAccessToken)
      );
      return;
    } catch (error) {
      setSubmitError(errorText(error, "We could not submit this claim request right now. Try again or contact support."));
    } finally {
      setSubmitBusy(false);
    }
  }

  const contactButtons = (
    <div className="flex flex-wrap gap-2">
      {CONTACT_OPTIONS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => setPreferredContact(key)}
          className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] ${
            preferredContact === key
              ? "border-[#cf4333] bg-[#fff4ef] text-[#ab3328]"
              : "border-[#decfbd] bg-white text-[#6f5a49] hover:bg-[#fff8f2]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">Claim Your Website</p>
            <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
              {restaurantName}
            </h1>
            <p className="max-w-3xl text-sm text-[#665b52] md:text-base">
              We prepared website designs for this restaurant. Claim the listing to edit,
              publish, and manage the restaurant's web presence.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7d6857]">
              <span className="rounded-full border border-[#eadccf] bg-[#fff9f3] px-3 py-1">
                {addressLine}
              </span>
              <span className="rounded-full border border-[#eadccf] bg-[#fff9f3] px-3 py-1">
                {phone || "Manual review needed"}
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              {PROCESS_STRIP.map((item, index) => (
                <div
                  key={item}
                  className={`rounded-2xl border px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] ${
                    index === 0
                      ? "border-[#f3c8bb] bg-[#fff4ef] text-[#b73a2f]"
                      : "border-[#eadccf] bg-[#fffaf5] text-[#7b6a5c]"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7462]">
              {labelSavedAt(lastSavedAt)}
              {draftLoaded ? " (restored)" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={resetLocalState}
            className="rounded-lg border border-[#ddc7b5] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#6b5543] hover:bg-[#fff8f2]"
          >
            Clear Draft
          </button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-5">
          <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b04a2d]">
                Your Website Preview
              </p>
              <h2
                ref={previewHeadingRef}
                tabIndex={-1}
                className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-[#1f1f1f] md:text-4xl focus:outline-none"
              >
                Pick the design you want to unlock
              </h2>
              <p className="max-w-3xl text-sm text-[#665b52]">
                Start with the recommended version below. You can view the full website, switch
                designs, and then verify ownership to unlock editing.
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-[30px] border border-[#e4d6c8] bg-[#f8efe7] shadow-[0_20px_80px_rgba(70,34,12,0.08)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#eadccf] bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff6d5e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffca5f]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#5fca75]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7768]">
                      Featured Design
                    </p>
                    <p className="text-sm font-semibold text-[#1f1f1f]">
                      {selectedTemplateOption.label}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-[#e6d6c8] bg-[#fff8f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b6451]">
                  Live preview
                </span>
              </div>

              <div className="grid gap-6 px-4 py-4 md:px-5 md:py-5 xl:grid-cols-[minmax(0,1.45fr)_320px]">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute inset-4 rounded-[28px] bg-[#f0c9b5]/35 blur-3xl"
                  />
                  <div className="relative overflow-hidden rounded-[24px] border border-[#dacbbb] bg-[#f4eee4] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <div
                      aria-busy={!previewLoaded}
                      className="relative h-[430px] bg-[#f5ecdf] md:h-[580px]"
                    >
                      <div className="pointer-events-none absolute inset-x-5 top-5 z-10 flex items-center justify-between gap-3 rounded-full border border-white/70 bg-white/78 px-4 py-2 backdrop-blur">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b7361]">
                            Live Desktop Preview
                          </p>
                          <p className="text-xs text-[#5f544b]">
                            Generated from this listing and ready to unlock.
                          </p>
                        </div>
                        <span className="rounded-full bg-[#fff1eb] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ab3328]">
                          {selectedTemplateOption.label}
                        </span>
                      </div>
                      {!previewLoaded ? (
                        <div className="absolute inset-0 z-10 flex flex-col justify-end bg-[linear-gradient(180deg,rgba(247,242,234,0.97)_0%,rgba(245,236,223,0.9)_58%,rgba(241,228,213,0.98)_100%)] p-5">
                          <div className="mb-auto flex items-center justify-between gap-3">
                            <div className="space-y-2">
                              <div className="h-3 w-28 animate-pulse rounded-full bg-white/70" />
                              <div className="h-2.5 w-44 animate-pulse rounded-full bg-white/60" />
                            </div>
                            <div className="h-7 w-24 animate-pulse rounded-full bg-white/65" />
                          </div>
                          <div className="space-y-3 rounded-[20px] border border-white/50 bg-white/50 p-4 shadow-[0_18px_40px_rgba(72,35,11,0.08)] backdrop-blur-sm">
                            <div className="h-4 w-40 animate-pulse rounded-full bg-white/70" />
                            <div className="h-24 animate-pulse rounded-[18px] bg-white/60" />
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
                      title={`${restaurantName} ${selectedTemplateOption.label} preview`}
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

                <div className="flex flex-col justify-between gap-4 rounded-[24px] border border-[#eadccf] bg-white/90 p-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                          selectedTemplate === "local-order"
                            ? "bg-[#ffe8e1] text-[#ab3328]"
                            : "bg-[#fff5ea] text-[#8b5d27]"
                        }`}
                      >
                        {selectedTemplateOption.badge}
                      </span>
                      <span className="rounded-full border border-[#eadccf] bg-[#fff9f3] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b6a5c]">
                        {selectedTemplateOption.label}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-[#1f1f1f]">
                        {selectedTemplateOption.detail}
                      </p>
                      <p className="mt-2 text-sm text-[#665b52]">
                        {selectedTemplateOption.bestFor}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTemplateOption.fitTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[#eadccf] bg-[#fff8f2] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7a5f4a]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleUnlockClick}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-[#c73f2f] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#ad3324] active:scale-[0.99]"
                      >
                        {verification?.verified_token
                          ? "Continue Website Setup"
                          : "Claim & Unlock This Website"}
                      </button>
                      <a
                        href={previewHref}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() =>
                          trackEvent("claim_full_preview_opened", {
                            source: "claim_preview_showroom",
                            state_slug: stateSlug,
                            city_slug: citySlug,
                            restaurant_slug: restaurantSlug,
                            template_key: selectedTemplate,
                          })
                        }
                        className="inline-flex w-full items-center justify-center rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2]"
                      >
                        Open Full Preview
                      </a>
                    </div>
                    <ul className="space-y-2 text-sm text-[#4f463f]">
                      {selectedTemplateOption.strengths.map((strength) => (
                        <li key={strength} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#c73f2f]" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#8b7462]">
                      Focus points: {selectedTemplateOption.focusPoints}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-2 md:mx-0 md:px-0">
              <div className="flex snap-x gap-3 md:grid md:grid-cols-3">
                {TEMPLATE_OPTIONS.map((option) => {
                  const selected = option.key === selectedTemplate;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleTemplateSelect(option.key)}
                      className={`min-w-[260px] snap-start rounded-2xl border p-4 text-left transition-all md:min-w-0 ${
                        selected
                          ? "border-[#cf4333] bg-[#fff4ef] shadow-sm"
                          : "border-[#e8dacd] bg-white hover:border-[#d9c5b7] hover:bg-[#fffaf6]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7361]">
                          {option.badge}
                        </p>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-[#1f1f1f]">{option.label}</p>
                      <p className="mt-1 text-sm text-[#665b52]">{option.bestFor}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {option.fitTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#eadccf] bg-[#fff8f2] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7a5f4a]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 space-y-1">
                        {option.strengths.map((strength) => (
                          <p key={strength} className="text-xs text-[#7b6a5c]">
                            {strength}
                          </p>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {!verification?.verified_token && !completed ? (
            <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b04a2d]">Claim To Unlock</p>
              <h2
                ref={verificationHeadingRef}
                tabIndex={-1}
                className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f] focus:outline-none"
              >
                Verify this website using the listed business phone
              </h2>
              <p className="mt-2 text-sm text-[#665b52]">
                We&apos;ll text the phone already listed for this restaurant so we can unlock
                editing.
              </p>
              <p className="mt-2 text-sm text-[#665b52]">
                If the listed line is shared, wrong, missing, or cannot receive texts,
                use manual review and we&apos;ll keep the claim moving another way.
              </p>
              <div className="mt-4 rounded-2xl border border-[#ebdece] bg-[#fff9f3] p-4 text-sm">
                <p className="font-semibold text-[#1f1f1f]">{restaurantName}</p>
                <p className="mt-1 text-[#665b52]">{addressLine}</p>
                <p className="mt-1 font-semibold text-[#1f1f1f]">Listed business phone: {phone || "Not available"}</p>
              </div>
              {note ? <p className="rounded-2xl border border-[#d9ead9] bg-[#f3fbf3] px-4 py-3 text-sm text-[#2f6b39]">{note}</p> : null}
              {verificationError ? <p className="rounded-2xl border border-[#f2d1c8] bg-[#fff4ef] px-4 py-3 text-sm text-[#9e3f28]">{verificationError}</p> : null}
              {phone ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendBusy}
                    className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324] disabled:opacity-60"
                  >
                    {sendBusy ? "Sending..." : verification?.session_id ? "Resend Code" : "Send Verification Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualReviewOpen((value) => !value)}
                    className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
                  >
                    Need another way?
                  </button>
                  <a
                    href="tel:+18183420990"
                    className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
                  >
                    Call Support
                  </a>
                  <a
                    href="https://wa.me/18183420990"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
                  >
                    WhatsApp Support
                  </a>
                </div>
              ) : null}
              {verification?.session_id ? (
                <div className="mt-5 rounded-2xl border border-[#eadccf] bg-[#fffaf5] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">Enter Verification Code</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit code"
                      className="w-full max-w-[220px] rounded-xl border border-[#d8c9bb] px-3 py-3 text-sm text-[#1f1f1f] focus:border-[#c73f2f] focus:outline-none focus:ring-2 focus:ring-[#f7d8cf]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verifyBusy || verificationCode.trim().length < 4}
                      className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324] disabled:opacity-60"
                    >
                      {verifyBusy ? "Verifying..." : "Verify Code"}
                    </button>
                  </div>
                </div>
              ) : null}
              {manualReviewOpen ? (
                <div className="mt-5 rounded-2xl border border-[#eadccf] bg-[#fffaf5] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">Manual Review Fallback</p>
                  <p className="mt-2 text-sm text-[#665b52]">
                    Use this if the listed business phone is missing, wrong, shared, or cannot receive texts.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Field label="Owner Name" value={ownerName} placeholder="First and last name" onChange={setOwnerName} />
                    <Field label="Phone" type="tel" value={ownerPhone} placeholder="Best number for follow-up" onChange={setOwnerPhone} />
                    <div className="md:col-span-2">
                      <Field label="Email" type="email" value={ownerEmail} placeholder="owner@restaurant.com" onChange={setOwnerEmail} />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7361]">Preferred Contact Method</p>
                    {contactButtons}
                  </div>
                  <div className="mt-4">
                    <Field
                      label="Why manual review is needed"
                      value={manualReviewReason}
                      placeholder="Example: the listed phone is an old landline and cannot receive texts."
                      onChange={setManualReviewReason}
                      rows={4}
                    />
                  </div>
                  {manualReviewError ? <p className="mt-4 rounded-2xl border border-[#f2d1c8] bg-[#fff4ef] px-4 py-3 text-sm text-[#9e3f28]">{manualReviewError}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleManualReview}
                      disabled={!canSubmitManualReview || manualBusy}
                      className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324] disabled:opacity-60"
                    >
                      {manualBusy ? "Submitting..." : "Request Manual Review"}
                    </button>
                    <a href="https://wa.me/18183420990" target="_blank" rel="noreferrer" className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]">
                      WhatsApp Support
                    </a>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {completed ? (
            <section className="rounded-3xl border border-[#d8ead8] bg-[#f7fcf7] p-6 shadow-sm md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6b39]">
                {completed === "manual_review" ? "Manual Review Requested" : "Claim Submitted"}
              </p>
              <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">
                {completed === "manual_review" ? "We saved your claim request" : "Your verified claim is in"}
              </h2>
              <p className="mt-3 text-sm text-[#4f5d51]">
                {completed === "manual_review"
                  ? "Our team will review the listing contact issue and reach out using your preferred method."
                  : "We saved your claim request and alerted the setup team for follow-up."}
              </p>
            </section>
          ) : null}

          {verification?.verified_token && !completed ? (
            <>
              <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b04a2d]">Claim Unlocked</p>
                    <h2
                      ref={onboardingHeadingRef}
                      tabIndex={-1}
                      className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f] focus:outline-none"
                    >
                      Finish setup and we can publish this website
                    </h2>
                    <p className="mt-2 text-sm text-[#665b52]">
                      Code confirmed on {verification.masked_phone || "the listed phone"}. Finish the owner setup steps below.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#d8ead8] bg-[#f3fbf3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f6b39]">
                      Verified
                    </span>
                    <button
                      type="button"
                      onClick={handleChangeDesign}
                      className="rounded-full border border-[#ddc7b5] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]"
                    >
                      Change Design
                    </button>
                  </div>
                </div>
                <div className="mt-5 grid gap-2 md:grid-cols-3">
                  {POST_VERIFY_STEPS.map((label, index) => (
                    <div
                      key={label}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] ${
                        index + 1 < step
                          ? "border-[#d8ead8] bg-[#f3fbf3] text-[#2f6b39]"
                          : index + 1 === step
                          ? "border-[#f3c8bb] bg-[#fff4ef] text-[#b73a2f]"
                          : "border-[#eadccf] bg-[#fffaf5] text-[#7b6a5c]"
                      }`}
                    >
                      {index + 1}. {label}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
                {step === 1 ? (
                  <div className="space-y-4">
                    <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-[#1f1f1f]">Step 1: Owner Contact</h2>
                    <p className="text-sm text-[#665b52]">Tell us who should receive website updates after verification.</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Owner Name" value={ownerName} placeholder="First and last name" onChange={setOwnerName} />
                      <Field label="Phone" type="tel" value={ownerPhone} placeholder="Best number for website updates" onChange={setOwnerPhone} />
                      <div className="md:col-span-2">
                        <Field label="Email" type="email" value={ownerEmail} placeholder="owner@restaurant.com" onChange={setOwnerEmail} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7361]">Preferred Contact Method</p>
                      {contactButtons}
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-4">
                    <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-[#1f1f1f]">
                      Step 2: Confirm Website Details
                    </h2>
                    <div className="rounded-2xl border border-[#ebdece] bg-[#fff9f3] p-4 text-sm text-[#4f463f]">
                      <p>
                        Menu data imported: <span className="font-semibold">{menuItemCount} items</span> across{" "}
                        <span className="font-semibold">{menuCategoryCount} categories</span>
                      </p>
                      <p className="mt-1">
                        Hours data: <span className="font-semibold">{hasHours ? "available" : "needs confirmation"}</span>
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-[#4f463f]">
                      <input type="checkbox" checked={verifiedMenu} onChange={(event) => setVerifiedMenu(event.target.checked)} className="h-4 w-4 accent-[#c73f2f]" />
                      Website details are ready to publish.
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#4f463f]">
                      <input type="checkbox" checked={verifiedHours} onChange={(event) => setVerifiedHours(event.target.checked)} className="h-4 w-4 accent-[#c73f2f]" />
                      Hours and contact info are ready to publish.
                    </label>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="space-y-4">
                    <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-[#1f1f1f]">
                      Step 3: Finalize Website Setup
                    </h2>
                    <div className="rounded-2xl border border-[#ebdece] bg-[#fff9f3] p-4 text-sm text-[#4f463f]">
                      <p className="font-semibold text-[#1f1f1f]">Single package, clear website handoff</p>
                      <p className="mt-2">Selected website: {selectedTemplateOption.label}.</p>
                      <p className="mt-1">Setup deposit today: $299.</p>
                      <p className="mt-1">Monthly billing after publish: $99/month.</p>
                      <p className="mt-1">Includes template handoff, website setup, menu data preservation, and bilingual support.</p>
                      <p className="mt-1">Target website timeline: 5-7 days after setup is confirmed.</p>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-start gap-2 text-sm text-[#4f463f]">
                        <input
                          type="checkbox"
                          checked={launchReady}
                          onChange={(event) => setLaunchReady(event.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-[#c73f2f]"
                        />
                        <span>I am ready to move forward with this verified website setup.</span>
                      </label>
                      <label className="flex items-start gap-2 text-sm text-[#4f463f]">
                        <input
                          type="checkbox"
                          checked={launchAgreementAccepted}
                          onChange={(event) => setLaunchAgreementAccepted(event.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-[#c73f2f]"
                        />
                        <span>
                          I understand the $299 setup deposit starts website setup now, and the $99/month plan starts only after the website goes live.
                        </span>
                      </label>
                    </div>
                    {submitError ? <p className="rounded-2xl border border-[#f2d1c8] bg-[#fff4ef] px-4 py-3 text-sm text-[#9e3f28]">{submitError}</p> : null}
                  </div>
                ) : null}

                <div className="mt-8 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep((value) => Math.max(1, value - 1))}
                    disabled={step <= 1 || submitBusy}
                    className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-2 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2] disabled:opacity-60"
                  >
                    Back
                  </button>
                  {step < POST_VERIFY_STEPS.length ? (
                    <button
                      type="button"
                      onClick={() => {
                        trackEvent("claim_step_completed", {
                          source: "claim_wizard",
                          step,
                          state_slug: stateSlug,
                          city_slug: citySlug,
                          restaurant_slug: restaurantSlug,
                          template_key: selectedTemplate,
                        });
                        setStep((value) => Math.min(POST_VERIFY_STEPS.length, value + 1));
                      }}
                      disabled={!canContinue}
                      className="rounded-xl bg-[#c73f2f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#ad3324] disabled:opacity-60"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitClaim}
                      disabled={!canSubmitClaim || submitBusy}
                      className="rounded-xl bg-[#c73f2f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#ad3324] disabled:opacity-60"
                    >
                      {submitBusy ? "Starting Checkout..." : "Confirm Website Setup"}
                    </button>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </section>

        <aside className="rounded-3xl border border-[#e6d6c6] bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:h-fit">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">What Happens Next</p>
          <p className="mt-2 text-lg font-semibold text-[#1f1f1f]">{selectedTemplateOption.label}</p>
          <p className="text-sm text-[#665b52]">{selectedTemplateOption.bestFor}</p>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-[#eadccf] bg-[#fff9f3] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8d7a66]">Status</p>
              <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                {completed === "manual_review"
                  ? "Manual review requested"
                  : verification?.verified_token
                  ? step === POST_VERIFY_STEPS.length
                    ? "Setup pending"
                    : `Setup step ${step} of ${POST_VERIFY_STEPS.length}`
                  : phone
                  ? "Verification pending"
                  : "Manual review required"}
              </p>
            </div>
            <div className="rounded-xl border border-[#eadccf] bg-[#fff9f3] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8d7a66]">Pricing</p>
              <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">$299 setup now</p>
              <p className="mt-1 text-xs text-[#6f6256]">$99/month starts after publish</p>
            </div>
            <div className="rounded-xl border border-[#eadccf] bg-[#fff9f3] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8d7a66]">Website ETA</p>
              <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">5-7 days</p>
            </div>
            <div className="rounded-xl border border-[#eadccf] bg-[#fff9f3] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8d7a66]">Support</p>
              <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">English | Chinese</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#eadccf] bg-[#fffaf5] p-4">
            <p className="text-sm font-semibold text-[#1f1f1f]">Preview, verify, confirm, publish.</p>
            <p className="mt-2 text-sm text-[#665b52]">
              Choose the design you want, verify the listed phone, confirm your details,
              and finalize setup so the website can move toward publish.
            </p>
          </div>

          <OwnerSetupExpectations mode="compact" />

          <div className="mt-4 flex flex-col gap-2">
            <Link href={listingHref} className="rounded-lg border border-[#ddc7b5] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]">
              Back to Listing
            </Link>
            <a href="tel:+18183420990" className="rounded-lg border border-[#ddc7b5] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]">
              Call Support
            </a>
            <a href="https://wa.me/18183420990" target="_blank" rel="noreferrer" className="rounded-lg border border-[#ddc7b5] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]">
              WhatsApp Support
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
