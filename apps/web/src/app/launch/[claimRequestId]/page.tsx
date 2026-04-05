import type { Metadata } from "next";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import {
  buildLaunchStatusHref,
  buildListingHref,
  buildOwnerWorkspaceHref,
  getClaimRequestStatus,
  type ClaimRequestStatusResponse,
} from "@/lib/claim";
import { LaunchKickoffHandoff } from "./LaunchKickoffHandoff";
import { LiveLaunchToolkit } from "./LiveLaunchToolkit";
import { LaunchPrimaryAction } from "./LaunchPrimaryAction";
import { LaunchReviewCenter } from "./LaunchReviewCenter";
import { LaunchSetupIntake } from "./LaunchSetupIntake";

export const metadata: Metadata = {
  title: "Owner Status",
  robots: { index: false },
};

type LaunchStatusParams = {
  claimRequestId?: string;
};

type LaunchStatusSearchParams = {
  access?: string;
  fresh?: string;
  mode?: string;
  payment?: string;
};

type LaunchStatusFetchResult =
  | { status: "ok"; payload: ClaimRequestStatusResponse }
  | { status: "not_found" }
  | { status: "access_denied" }
  | { status: "error" };

async function getLaunchStatus(
  claimRequestId: string,
  accessToken: string
): Promise<LaunchStatusFetchResult> {
  try {
    const payload = await getClaimRequestStatus(claimRequestId, accessToken);
    return { status: "ok", payload };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { status: "not_found" };
    }
    if (error instanceof ApiError && error.status === 403) {
      return { status: "access_denied" };
    }
    return { status: "error" };
  }
}

function templateLabel(templateKey: string): string {
  switch (templateKey) {
    case "local-order":
      return "Local Order";
    case "local-storefront":
      return "Storefront";
    case "local-express":
      return "Express";
    case "local-feast":
      return "Feast";
    case "ming-balanced":
      return "Ming Balanced";
    case "ming-full":
      return "Ming Full";
    default:
      return templateKey;
  }
}

function statusAccent(status: string): string {
  switch (status) {
    case "live":
    case "approved_for_launch":
      return "border-[#d8ead8] bg-[#f3fbf3] text-[#2f6b39]";
    case "manual_review_requested":
    case "changes_requested":
      return "border-[#ead9c3] bg-[#fff8ef] text-[#8b5d27]";
    case "deposit_paid":
      return "border-[#d8ead8] bg-[#f3fbf3] text-[#2f6b39]";
    default:
      return "border-[#f3c8bb] bg-[#fff4ef] text-[#b73a2f]";
  }
}

function timelineClasses(state: "completed" | "current" | "upcoming"): string {
  if (state === "completed") {
    return "border-[#d8ead8] bg-[#f3fbf3] text-[#2f6b39]";
  }
  if (state === "current") {
    return "border-[#f3c8bb] bg-[#fff4ef] text-[#b73a2f]";
  }
  return "border-[#eadccf] bg-[#fffaf5] text-[#7b6a5c]";
}

function formatDateLabel(iso: string | null): string {
  if (!iso) return "Not set yet";
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "Not set yet";
  return value.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function absoluteWebUrl(path: string): string {
  const baseUrl = (process.env.WEB_BASE_URL || "http://localhost:3001")
    .trim()
    .replace(/\/+$/, "");
  return new URL(path, `${baseUrl}/`).toString();
}

function buildPaymentBanner(payment?: string) {
  switch (payment) {
    case "paid":
    case "success":
      return {
        title: "Setup deposit received",
        detail: "This private owner page is updated and kickoff can move forward now.",
        tone: "border-[#d8ead8] bg-[#f7fcf7] text-[#2f6b39]",
      };
    case "failed":
      return {
        title: "Payment did not complete",
        detail: "You can retry the setup deposit from this page whenever you are ready.",
        tone: "border-[#f2d1c8] bg-[#fff4ef] text-[#9e3f28]",
      };
    case "cancelled":
      return {
        title: "Checkout cancelled",
        detail: "No payment was made. The setup deposit is still waiting whenever you want to continue.",
        tone: "border-[#eadccf] bg-[#fffaf5] text-[#7b6a5c]",
      };
    case "error":
      return {
        title: "Checkout needs one more try",
        detail: "The website activation request is saved. Use the button below to open checkout again.",
        tone: "border-[#f2d1c8] bg-[#fff4ef] text-[#9e3f28]",
      };
    default:
      return null;
  }
}

function buildFreshBanner(
  claim: ClaimRequestStatusResponse,
  mode?: string
): { eyebrow: string; title: string; detail: string; tone: string } {
  const isManualReviewEntry = mode === "manual-review";
  const isReviewApproved = mode === "review-approved";
  const isReviewChanges = mode === "review-changes";

  if (claim.status === "manual_review_requested") {
    return {
      eyebrow: "Manual Review Saved",
      title: "Your claim is in the ownership review queue",
      detail:
        "Bookmark this page. It is the private owner checkpoint for review, activation, and website progress.",
      tone: "border-[#ead9c3] bg-[#fff8ef] text-[#8b5d27]",
    };
  }

  if (isManualReviewEntry) {
    return {
      eyebrow: "Ownership Approved",
      title: "Your owner workspace is ready",
      detail:
        "Ownership review is complete. Use this private page to manage and publish the website.",
      tone: "border-[#d8ead8] bg-[#f7fcf7] text-[#2f6b39]",
    };
  }

  if (isReviewApproved) {
    return {
      eyebrow: "Approval Saved",
      title: "Your website approval is locked in",
      detail:
        "The team has your approval and is moving this build through final website checks now.",
      tone: "border-[#d8ead8] bg-[#f7fcf7] text-[#2f6b39]",
    };
  }

  if (isReviewChanges) {
    return {
      eyebrow: "Changes Saved",
      title: "Your requested edits are with the website team",
      detail:
        "We saved your revision notes. The team will update the build and send a fresh review handoff when it is ready again.",
      tone: "border-[#ead9c3] bg-[#fff8ef] text-[#8b5d27]",
    };
  }

  return {
    eyebrow: "Website Request Saved",
    title: "Your private owner link is ready",
    detail:
      "Bookmark this page. It is the private owner checkpoint for website activation progress.",
    tone: "border-[#d8ead8] bg-[#f7fcf7] text-[#2f6b39]",
  };
}

function buildLaunchNarrative(claim: ClaimRequestStatusResponse): {
  statusDetail: string;
  nextStepTitle: string;
  nextStepDetail: string;
} {
  if (claim.setupDepositState === "paid" && claim.kickoffState === "pending") {
    if (claim.setupIntakeStatus === "submitted") {
      return {
        statusDetail:
          "We have your activation details. Support will reach out within 24 hours to confirm timing.",
        nextStepTitle: "Watch for activation confirmation",
        nextStepDetail:
          "Your setup notes are already saved, so the next move is on the team. If anything changes before activation, message support on WhatsApp or call us directly.",
      };
    }

    return {
      statusDetail:
        "Kickoff is the next step. Start setup on WhatsApp now, or we'll reach out within 24 hours.",
      nextStepTitle: "Start setup on WhatsApp",
      nextStepDetail:
        "We already have your setup deposit. WhatsApp is the fastest path into kickoff, and we'll still follow up by your preferred contact method within 24 hours.",
    };
  }

  if (claim.status === "kickoff_scheduled") {
    return {
      statusDetail:
        "Kickoff is booked. Support will review your menu priorities, hours, contact details, and any needed account access on the call.",
      nextStepTitle: "Get ready for the kickoff call",
      nextStepDetail:
        "Have your menu, hours, logo, and any Google, Yelp, or domain logins nearby so the team can keep setup moving quickly.",
    };
  }

  if (claim.status === "build_in_progress") {
    return {
      statusDetail:
        "The team is preparing your website and guest-facing details now.",
      nextStepTitle: "Watch for your review handoff",
      nextStepDetail:
        "We'll reach out when the first polished version is ready so you can review it and request any final changes.",
    };
  }

  if (claim.status === "ready_for_review") {
    return {
      statusDetail:
        "Your website build is ready for owner review. Check the preview, then either approve it for launch or send back final edits.",
      nextStepTitle: "Review the site and request changes",
      nextStepDetail:
        "Use the review center below to inspect the build, confirm the details, and either approve it for launch or send back the last changes.",
    };
  }

  if (claim.status === "changes_requested") {
    return {
      statusDetail:
        "Your requested changes are with the team now. We will send a fresh review handoff when the updated build is ready.",
      nextStepTitle: "Watch for your refreshed review link",
      nextStepDetail:
        "Support is updating the build based on your notes. When the new review pass is ready, you will get another owner review email and private owner-page update.",
    };
  }

  if (claim.status === "approved_for_launch") {
    return {
      statusDetail:
        "Approval received. The team is running final website checks before the site goes live.",
      nextStepTitle: "Watch for the publish confirmation",
      nextStepDetail:
        "Final checks are in motion now. We will email as soon as the site is live, and monthly billing will stay pending until launch is complete.",
    };
  }

  if (claim.status === "live") {
    return {
      statusDetail: "Your direct-order website is live and ready to share with guests.",
      nextStepTitle: "Start sending guests to your site",
      nextStepDetail:
        "Open the live site, then update Google, Yelp, and social links to point guests to your direct-order site. Monthly billing is now active.",
    };
  }

  return {
    statusDetail: claim.statusDetail,
    nextStepTitle: claim.nextStepTitle,
    nextStepDetail: claim.nextStepDetail,
  };
}

function reviewIssueAreaLabel(issueArea: string): string {
  switch (issueArea) {
    case "branding_photos":
      return "Branding, logo, or photos";
    case "menu_pricing":
      return "Menu items or pricing";
    case "hours_contact":
      return "Hours, phone, or address";
    case "fulfillment_ordering":
      return "Pickup, delivery, or ordering flow";
    case "links_cta":
      return "Links or guest-facing CTA";
    default:
      return issueArea.replace(/_/g, " ");
  }
}

export default async function LaunchStatusPage({
  params,
  searchParams,
}: {
  params: Promise<LaunchStatusParams>;
  searchParams: Promise<LaunchStatusSearchParams>;
}) {
  const routeParams = await params;
  const query = await searchParams;
  const claimRequestId = (routeParams.claimRequestId || "").trim();
  const accessToken = (query.access || "").trim();

  if (!claimRequestId) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
            Owner Status
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
            Missing owner request
          </h1>
          <p className="mt-2 text-sm text-[#665b52]">
            We need a claim request ID to load the private owner page.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/search?claim=1"
              className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324]"
            >
              Find My Restaurant
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
            Launch Status
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
            Secure launch link required
          </h1>
          <p className="mt-2 text-sm text-[#665b52]">
            This page uses the private launch link from your claim confirmation so only the owner
            can view the status and payment actions.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/search?claim=1"
              className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324]"
            >
              Start From Your Listing
            </Link>
            <a
              href="https://wa.me/18183420990"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
            >
              WhatsApp Support
            </a>
          </div>
        </section>
      </div>
    );
  }

  const result = await getLaunchStatus(claimRequestId, accessToken);

  if (result.status === "not_found") {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
            Launch Status
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
            Launch request not found
          </h1>
          <p className="mt-2 text-sm text-[#665b52]">
            We could not find that launch request. Search for your listing again or contact
            support if you already verified it.
          </p>
        </section>
      </div>
    );
  }

  if (result.status === "access_denied") {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
            Launch Status
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
            Secure launch link expired
          </h1>
          <p className="mt-2 text-sm text-[#665b52]">
            The launch page needs the latest secure link from your claim confirmation. If you lost
            it, contact support and we can help you continue.
          </p>
        </section>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
            Launch Status
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
            Temporary loading issue
          </h1>
          <p className="mt-2 text-sm text-[#665b52]">
            We could not load this launch request right now. Try again or contact support to keep
            things moving.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={buildLaunchStatusHref(claimRequestId, accessToken)}
              className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324]"
            >
              Retry Status Page
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const claim = result.payload;
  const listingHref = buildListingHref({
    stateSlug: claim.restaurant.stateSlug,
    citySlug: claim.restaurant.citySlug,
    restaurantSlug: claim.restaurant.restaurantSlug,
  });
  const liveSiteUrl = absoluteWebUrl(listingHref);
  const previewHref = `${listingHref}?preview=1&template=${encodeURIComponent(claim.templateKey)}`;
  const embeddedPreviewHref = `${previewHref}&claimPreview=1`;
  const isFresh = query.fresh === "1";
  const freshBanner = isFresh ? buildFreshBanner(claim, query.mode) : null;
  const paymentBanner = buildPaymentBanner(query.payment);
  const launchNarrative = buildLaunchNarrative(claim);
  const showPayAction =
    claim.paymentUnlocked && claim.setupDepositState !== "paid";
  const showKickoffSupport =
    claim.setupDepositState === "paid" && claim.kickoffState === "pending";
  const hasSavedSetupIntake = claim.setupIntakeStatus === "submitted";
  const showSetupIntake = showKickoffSupport;
  const showReviewCenter = claim.status === "ready_for_review";
  const showReviewResponsePanel =
    claim.status === "changes_requested" || claim.status === "approved_for_launch";
  const showGenericNextAction =
    !showKickoffSupport &&
    !showReviewCenter &&
    !showReviewResponsePanel &&
    claim.status !== "live";
  const showLiveLinks = claim.status === "live";
  const setupIntakeDetail =
    hasSavedSetupIntake
      ? "Support can use your saved hours, account, and asset notes in kickoff."
      : showSetupIntake
        ? "Save the setup details below so support is not relying on manual notes alone."
        : "No structured kickoff intake was saved on this request. Support can still help with updates directly.";
  const showPaymentBanner = !(
    showKickoffSupport &&
    (query.payment === "paid" || query.payment === "success")
  );

  return (
    <div className={`space-y-6 ${showKickoffSupport ? "pb-24 md:pb-0" : ""}`}>
      {freshBanner ? (
        <section className={`rounded-3xl border p-5 shadow-sm ${freshBanner.tone}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em]">
            {freshBanner.eyebrow}
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">
            {freshBanner.title}
          </h1>
          <p className="mt-2 text-sm">{freshBanner.detail}</p>
        </section>
      ) : null}

      {paymentBanner && showPaymentBanner ? (
        <section className={`rounded-3xl border p-5 shadow-sm ${paymentBanner.tone}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em]">
            Payment Update
          </p>
          <h2 className="font-[var(--font-display)] mt-2 text-2xl font-bold tracking-tight">
            {paymentBanner.title}
          </h2>
          <p className="mt-2 text-sm">{paymentBanner.detail}</p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
              Launch Status
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-[var(--font-display)] text-4xl font-black tracking-tight text-[#1f1f1f]">
                {claim.restaurant.name}
              </h1>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusAccent(
                  claim.status
                )}`}
              >
                {claim.statusLabel}
              </span>
            </div>
            <p className="max-w-3xl text-sm text-[#665b52] md:text-base">
              {launchNarrative.statusDetail}
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7d6857]">
              <span className="rounded-full border border-[#eadccf] bg-[#fff9f3] px-3 py-1">
                {claim.restaurant.address1}, {claim.restaurant.city}, {claim.restaurant.state}
              </span>
              <span className="rounded-full border border-[#eadccf] bg-[#fff9f3] px-3 py-1">
                Submitted {formatDateLabel(claim.submittedAt)}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[380px]">
            <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Selected Design
              </p>
              <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">
                {templateLabel(claim.templateKey)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Setup Deposit
              </p>
              <p className="mt-2 text-sm font-semibold capitalize text-[#1f1f1f]">
                {claim.setupDepositState.replace(/_/g, " ")}
              </p>
              <p className="mt-1 text-xs text-[#6f6256]">{claim.setupDepositDetail}</p>
            </div>
            <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Pricing
              </p>
              <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">
                {formatMoney(claim.pricing.setupDepositCents, claim.pricing.currency)} now
              </p>
              <p className="mt-1 text-xs text-[#6f6256]">
                {formatMoney(claim.pricing.monthlyPlanCents, claim.pricing.currency)}/month after launch
              </p>
            </div>
            <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Monthly Billing
              </p>
              <p className="mt-2 text-sm font-semibold capitalize text-[#1f1f1f]">
                {claim.monthlyBillingState}
              </p>
              <p className="mt-1 text-xs text-[#6f6256]">{claim.monthlyBillingDetail}</p>
            </div>
          </div>
        </div>
      </section>

      {showKickoffSupport ? (
        <LaunchKickoffHandoff
          claimRequestId={claim.claimRequestId}
          templateKey={claim.templateKey}
          preferredContactMethod={claim.preferredContactMethod}
          previewHref={previewHref}
          setupIntakeSubmitted={hasSavedSetupIntake}
        />
      ) : null}

      {showLiveLinks ? (
        <LiveLaunchToolkit
          claimRequestId={claim.claimRequestId}
          templateKey={claim.templateKey}
          restaurantName={claim.restaurant.name}
          restaurantSlug={claim.restaurant.restaurantSlug}
          liveSiteUrl={liveSiteUrl}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {showSetupIntake ? (
            <LaunchSetupIntake
              claimRequestId={claim.claimRequestId}
              accessToken={accessToken}
              claim={claim}
            />
          ) : null}

          {showReviewCenter ? (
            <LaunchReviewCenter
              claimRequestId={claim.claimRequestId}
              accessToken={accessToken}
              restaurantName={claim.restaurant.name}
              templateLabel={templateLabel(claim.templateKey)}
              previewHref={previewHref}
              embeddedPreviewHref={embeddedPreviewHref}
            />
          ) : null}

          {showReviewResponsePanel ? (
            <section
              className={`rounded-3xl border p-6 shadow-sm md:p-8 ${
                claim.status === "approved_for_launch"
                  ? "border-[#d8ead8] bg-[#f7fcf7]"
                  : "border-[#ead9c3] bg-[#fff8ef]"
              }`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                  claim.status === "approved_for_launch"
                    ? "text-[#2f6b39]"
                    : "text-[#8b5d27]"
                }`}
              >
                {claim.status === "approved_for_launch"
                  ? "Launch Approval Received"
                  : "Revision Request Saved"}
              </p>
              <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">
                {claim.status === "approved_for_launch"
                  ? "Final launch checks are in motion"
                  : "The team is revising your website now"}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#665b52]">
                {claim.status === "approved_for_launch"
                  ? "You approved the build, so the team is finishing the last launch checks now. We will send the live launch confirmation as soon as the site is ready to share."
                  : "We saved your requested changes and the team is working through them. When the updated build is ready, you will get a fresh review handoff on this page and by email."}
              </p>

              {claim.status === "changes_requested" &&
              (claim.reviewIssueAreas.length > 0 || claim.reviewNotes) ? (
                <div className="mt-5 rounded-2xl border border-[#eadccf] bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                    Saved Review Notes
                  </p>
                  {claim.reviewIssueAreas.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {claim.reviewIssueAreas.map((issueArea) => (
                        <span
                          key={issueArea}
                          className="rounded-full border border-[#e0cfbe] bg-[#fff9f3] px-3 py-1 text-xs font-semibold text-[#6b5543]"
                        >
                          {reviewIssueAreaLabel(issueArea)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {claim.reviewNotes ? (
                    <p className="mt-3 text-sm leading-6 text-[#5d544c]">{claim.reviewNotes}</p>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b04a2d]">
              Launch Progress
            </p>
            <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">
              What happens next
            </h2>
            <div className="mt-6 space-y-3">
              {claim.timeline.map((step, index) => (
                <div
                  key={step.key}
                  className={`rounded-2xl border p-4 ${timelineClasses(step.state)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]">
                        Step {index + 1}
                      </p>
                      <p className="mt-2 text-lg font-semibold">{step.label}</p>
                      <p className="mt-2 text-sm leading-6">{step.detail}</p>
                    </div>
                    <span className="rounded-full border border-current/15 bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                      {step.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {showGenericNextAction ? (
            <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b04a2d]">
                Next Action
              </p>
              <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">
                {launchNarrative.nextStepTitle}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#665b52]">
                {launchNarrative.nextStepDetail}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {showPayAction ? (
                  <LaunchPrimaryAction
                    claimRequestId={claim.claimRequestId}
                    accessToken={accessToken}
                  />
                ) : null}
                {!showPayAction ? (
                  <>
                    <a
                      href="tel:+18183420990"
                      className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324]"
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
                  </>
                ) : null}
                <Link
                  href={previewHref}
                  className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
                >
                  Open Website Preview
                </Link>
                {showLiveLinks ? (
                  <Link
                    href={listingHref}
                    className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
                  >
                    Open Live Listing
                  </Link>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
          <section className="rounded-3xl border border-[#e6d6c6] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
              Launch Summary
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-[#eadccf] bg-[#fff9f3] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8d7a66]">Status</p>
                <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">{claim.statusLabel}</p>
                <p className="mt-1 text-xs text-[#6f6256]">{launchNarrative.statusDetail}</p>
              </div>
              <div className="rounded-xl border border-[#eadccf] bg-[#fff9f3] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8d7a66]">Kickoff</p>
                <p className="mt-1 text-sm font-semibold capitalize text-[#1f1f1f]">
                  {claim.kickoffState}
                </p>
                <p className="mt-1 text-xs text-[#6f6256]">{claim.kickoffDetail}</p>
              </div>
              <div className="rounded-xl border border-[#eadccf] bg-[#fff9f3] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8d7a66]">
                  Setup Intake
                </p>
                <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                  {hasSavedSetupIntake
                    ? "Kickoff details saved"
                    : "Kickoff details missing"}
                </p>
                <p className="mt-1 text-xs text-[#6f6256]">{setupIntakeDetail}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e6d6c6] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
              Owner Details
            </p>
            <div className="mt-4 space-y-3 text-sm text-[#4f463f]">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#8d7a66]">Owner</p>
                <p className="mt-1 font-semibold text-[#1f1f1f]">{claim.ownerName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#8d7a66]">Contact</p>
                <p className="mt-1 font-semibold text-[#1f1f1f]">{claim.ownerPhone}</p>
                <p className="text-[#665b52]">{claim.ownerEmail}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#8d7a66]">
                  Preferred Contact
                </p>
                <p className="mt-1 font-semibold capitalize text-[#1f1f1f]">
                  {claim.preferredContactMethod}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#8d7a66]">
                  Listing
                </p>
                <p className="mt-1 font-semibold text-[#1f1f1f]">{claim.restaurant.name}</p>
                <p className="text-[#665b52]">
                  {claim.restaurant.address1}, {claim.restaurant.city}, {claim.restaurant.state}
                </p>
                <p className="text-[#665b52]">
                  Website design: {templateLabel(claim.templateKey)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e6d6c6] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
              Quick Links
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {showLiveLinks ? (
                <>
                  <Link
                    href={listingHref}
                    className="rounded-lg border border-[#ddc7b5] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]"
                  >
                    Open Live Site
                  </Link>
                  <a
                    href="tel:+18183420990"
                    className="rounded-lg border border-[#ddc7b5] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]"
                  >
                    Call Support
                  </a>
                  <a
                    href="https://wa.me/18183420990"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-[#ddc7b5] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]"
                  >
                    WhatsApp Support
                  </a>
                </>
              ) : showKickoffSupport ? (
                <>
                  <a
                    href="https://wa.me/18183420990"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-[#ddc7b5] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]"
                  >
                    {hasSavedSetupIntake ? "Message Support" : "Start Setup"}
                  </a>
                  <a
                    href="tel:+18183420990"
                    className="rounded-lg border border-[#ddc7b5] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]"
                  >
                    Call Support
                  </a>
                </>
              ) : (
                <>
                  <Link
                    href={listingHref}
                    className="rounded-lg border border-[#ddc7b5] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]"
                  >
                    Back to Listing
                  </Link>
                  <Link
                    href={previewHref}
                    className="rounded-lg border border-[#ddc7b5] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]"
                  >
                    Preview Website
                  </Link>
                </>
              )}
              <Link
                href={buildLaunchStatusHref(claim.claimRequestId, accessToken)}
                className="rounded-lg border border-[#ddc7b5] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]"
              >
                Refresh Status Page
              </Link>
              <Link
                href={buildOwnerWorkspaceHref(claim.claimRequestId, accessToken)}
                className="rounded-lg border border-[#ddc7b5] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6b5543] hover:bg-[#fff8f2]"
              >
                Edit Website Details
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
