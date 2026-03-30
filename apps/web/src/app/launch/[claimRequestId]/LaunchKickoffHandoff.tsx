"use client";

import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type LaunchKickoffHandoffProps = {
  claimRequestId: string;
  templateKey: string;
  preferredContactMethod: string;
  previewHref: string;
  setupIntakeSubmitted: boolean;
};

const SUPPORT_PHONE = "+18183420990";
const SUPPORT_WHATSAPP = "https://wa.me/18183420990";

const PREP_ITEMS = [
  "Menu and pricing confirmation",
  "Business hours and pickup or delivery preferences",
  "Logo and food photos if you have them",
  "Domain, Google, and Yelp access if support asks for it",
  "POS, printer, and payment setup details if relevant",
];

function preferredContactLabel(method: string) {
  switch (method) {
    case "call":
      return "Call";
    case "text":
      return "Text";
    case "whatsapp":
      return "WhatsApp";
    case "email":
      return "Email";
    default:
      return method;
  }
}

export function LaunchKickoffHandoff({
  claimRequestId,
  templateKey,
  preferredContactMethod,
  previewHref,
  setupIntakeSubmitted,
}: LaunchKickoffHandoffProps) {
  const preferredContact = preferredContactLabel(preferredContactMethod);
  const analyticsPayload = JSON.stringify({
    claim_request_id: claimRequestId,
    template_key: templateKey,
    preferred_contact_method: preferredContactMethod,
  });
  const primaryCtaLabel = setupIntakeSubmitted
    ? "Message Support on WhatsApp"
    : "Start Setup on WhatsApp";
  const handoffTitle = setupIntakeSubmitted
    ? "Kickoff details received. Your launch is officially in our queue."
    : "Deposit received. Your launch is officially in our queue.";
  const handoffDetail = setupIntakeSubmitted
    ? "Your kickoff notes are already saved, so the next move is on the launch team. We will reach out within 24 hours to confirm timing, and you can still message support now if anything changed."
    : "Start setup on WhatsApp now if you want the fastest handoff. If not, our team will still reach out within 24 hours to lock in kickoff and confirm the last details.";
  const contactDetail = setupIntakeSubmitted
    ? "Your setup details are already saved. Support will use them to keep kickoff focused and move faster."
    : "Save the setup details below so support has your hours, access notes, and assets before kickoff starts.";
  const nextStepWithinDay = setupIntakeSubmitted
    ? "Within 24 hours: support confirms kickoff timing using the setup details you already saved."
    : "Within 24 hours: support confirms kickoff timing and the exact setup items needed for your restaurant.";
  const mobileTitle = setupIntakeSubmitted
    ? "Setup details saved. We'll reach out within 24 hours."
    : "Deposit received. Start setup on WhatsApp now.";
  const mobileDetail = setupIntakeSubmitted
    ? "Message support if anything changed before kickoff."
    : "We'll also reach out within 24 hours.";

  useEffect(() => {
    trackEvent("launch_prep_checklist_viewed", {
      claim_request_id: claimRequestId,
      template_key: templateKey,
      preferred_contact_method: preferredContactMethod,
    });
  }, [claimRequestId, preferredContactMethod, templateKey]);

  return (
    <>
      <section className="rounded-3xl border border-[#d9e6d4] bg-[#f7fcf7] p-6 shadow-sm md:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6b39]">
                Kickoff Handoff
              </p>
              <h2 className="font-[var(--font-display)] mt-2 text-3xl font-black tracking-tight text-[#1f1f1f] md:text-4xl">
                {handoffTitle}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4f5d51] md:text-base">
                {handoffDetail}
              </p>
            </div>

            <div className="rounded-2xl border border-[#d7e7d3] bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7f69]">
                Preferred Follow-Up
              </p>
              <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">
                We&apos;ll also reach out by your preferred contact method: {preferredContact}
              </p>
              <p className="mt-1 text-sm text-[#5d6f5d]">{contactDetail}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={SUPPORT_WHATSAPP}
                target="_blank"
                rel="noreferrer"
                data-analytics-event="launch_kickoff_whatsapp_clicked"
                data-analytics-payload={analyticsPayload}
                className="rounded-xl bg-[#2f6b39] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#25572d]"
              >
                {primaryCtaLabel}
              </a>
              <a
                href={`tel:${SUPPORT_PHONE}`}
                data-analytics-event="launch_support_call_clicked"
                data-analytics-payload={analyticsPayload}
                className="rounded-xl border border-[#cfdcc9] bg-white px-4 py-3 text-sm font-semibold text-[#42533f] transition-colors hover:bg-[#f6fbf4]"
              >
                Call Support
              </a>
            </div>

            <p className="text-sm text-[#5d6f5d]">
              Need to double-check the current site before kickoff?{" "}
              <Link
                href={previewHref}
                className="font-semibold text-[#2f6b39] underline-offset-4 hover:underline"
              >
                Open website preview
              </Link>
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-[#d7e7d3] bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7f69]">
                What To Have Ready
              </p>
              <ul className="mt-4 space-y-3">
                {PREP_ITEMS.map((item, index) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#42533f]">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#cfe1ca] bg-[#eef8eb] text-xs font-bold text-[#2f6b39]">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#d7e7d3] bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7f69]">
                What Happens Next
              </p>
              <div className="mt-4 space-y-3 text-sm text-[#42533f]">
                <p>{nextStepWithinDay}</p>
                <p>
                  After kickoff: the team starts building your website, menu, and direct-order
                  setup for owner review.
                </p>
                <p>
                  Before launch: you&apos;ll get a review pass so any final edits can be requested
                  before the site goes live.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="sticky-rise pointer-events-auto mx-auto max-w-[1080px] rounded-2xl border border-[#d7e7d3] bg-white/96 px-3 py-3 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#1f1f1f]">{mobileTitle}</p>
              <p className="text-xs text-[#5d6f5d]">{mobileDetail}</p>
            </div>
            <a
              href={SUPPORT_WHATSAPP}
              target="_blank"
              rel="noreferrer"
              data-analytics-event="launch_kickoff_whatsapp_clicked"
              data-analytics-payload={JSON.stringify({
                claim_request_id: claimRequestId,
                template_key: templateKey,
                preferred_contact_method: preferredContactMethod,
                placement: "sticky",
              })}
              className="rounded-xl bg-[#2f6b39] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25572d]"
            >
              {setupIntakeSubmitted ? "Message Support" : "Start Setup"}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
