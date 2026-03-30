"use client";

import { useState } from "react";
import type { AdminDiagnostics, AdminTestEmailResponse } from "@/lib/types";

type AdminReadinessPanelProps = {
  diagnostics: AdminDiagnostics;
  webAdminTokenConfigured: boolean;
  publicApiUrl: string;
  internalApiUrl: string;
};

function readinessBadge(isReady: boolean) {
  return isReady
    ? "border-[#d8ead8] bg-[#f7fcf7] text-[#2f6b39]"
    : "border-[#f3c8bb] bg-[#fff4ef] text-[#9e3f28]";
}

function statusLabel(isReady: boolean) {
  return isReady ? "Ready" : "Missing";
}

export function AdminReadinessPanel({
  diagnostics,
  webAdminTokenConfigured,
  publicApiUrl,
  internalApiUrl,
}: AdminReadinessPanelProps) {
  const testBlockedReason = !webAdminTokenConfigured
    ? "Admin email testing is disabled until ADMIN_TOKEN is configured for the web app."
    : !diagnostics.smtp_ready
      ? "SMTP test is unavailable until SMTP_HOST and SMTP_PORT are set."
      : !diagnostics.smtp_sender_ready
        ? "SMTP test is unavailable until CLAIM_ALERT_EMAIL_FROM or SMTP_USERNAME is set."
        : null;
  const [testRecipient, setTestRecipient] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function sendTestEmail() {
    if (testBlockedReason) {
      setTestResult(null);
      setTestError(testBlockedReason);
      return;
    }

    setIsSending(true);
    setTestResult(null);
    setTestError(null);

    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: testRecipient.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as AdminTestEmailResponse | { detail?: string };
      if (!response.ok) {
        throw new Error(payload.detail || "Unable to send SMTP test email.");
      }

      const successPayload = payload as AdminTestEmailResponse;
      setTestResult(successPayload.detail);
      if (!testRecipient.trim()) {
        setTestRecipient(successPayload.recipient);
      }
    } catch (error) {
      setTestError(error instanceof Error ? error.message : "Unable to send SMTP test email.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">First Paid Customer Readiness</h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">
          This is the operator checkpoint for the non-visual pieces that have to be true before
          you confidently take real money: admin access, Stripe, SMTP, and env wiring.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "API Admin Token",
            ready: diagnostics.api_admin_token_configured,
            detail: "The API can accept /admin requests with the shared token model.",
          },
          {
            label: "Web Admin Token",
            ready: webAdminTokenConfigured,
            detail: "The admin screens can send the shared token to the API.",
          },
          {
            label: "Stripe Checkout",
            ready: diagnostics.stripe_ready,
            detail: `Provider: ${diagnostics.payment_provider}.`,
          },
          {
            label: "Owner Email Delivery",
            ready: diagnostics.owner_notifications_ready,
            detail: "SMTP transport, sender identity, and launch links are ready for owner emails.",
          },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border p-4 ${readinessBadge(item.ready)}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">{item.label}</p>
            <p className="mt-2 text-lg font-bold">{statusLabel(item.ready)}</p>
            <p className="mt-2 text-sm leading-6">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            Warnings
          </p>
          {diagnostics.warnings.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {diagnostics.warnings.map((warning) => (
                <li key={warning} className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                  {warning}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-600">
              No obvious readiness warnings detected from the current API env.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            Env Snapshot
          </p>
          <dl className="mt-3 space-y-3 text-sm text-gray-700">
            <div>
              <dt className="font-semibold text-gray-900">Public API URL</dt>
              <dd>{publicApiUrl}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Internal API URL</dt>
              <dd>{internalApiUrl}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">SMS Provider</dt>
              <dd>{diagnostics.sms_provider}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">SMTP Transport</dt>
              <dd>{statusLabel(diagnostics.smtp_ready)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">SMTP Auth</dt>
              <dd>{diagnostics.smtp_auth_configured ? "Configured" : "Not required / missing"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Sender Identity</dt>
              <dd>{statusLabel(diagnostics.smtp_sender_ready)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Launch Link Base URL</dt>
              <dd>{statusLabel(diagnostics.web_base_url_configured)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Internal Claim Alerts Inbox</dt>
              <dd>{statusLabel(diagnostics.claim_alert_recipient_ready)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-[#fffaf5] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b6a5c]">
              SMTP Test
            </p>
            <p className="mt-2 text-sm text-[#5d5146]">
              Send a real test email from the current API env. Leave the field blank to use the
              internal claim-alert inbox once that address is configured.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            type="email"
            value={testRecipient}
            onChange={(event) => setTestRecipient(event.target.value)}
            placeholder="owner@restaurant.com"
            className="flex-1 rounded-xl border border-[#e3d4c5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#b73a2f] focus:ring-2 focus:ring-[#f3c8bb]"
          />
          <button
            type="button"
            onClick={sendTestEmail}
            disabled={isSending || Boolean(testBlockedReason)}
            className="rounded-xl bg-[#1f1f1f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? "Sending test email..." : "Send Test Email"}
          </button>
        </div>

        {testBlockedReason ? (
          <p className="mt-3 text-xs text-[#7b6a5c]">
            {testBlockedReason}
          </p>
        ) : null}

        {testResult ? (
          <p className="mt-3 rounded-xl border border-[#d8ead8] bg-[#f7fcf7] px-3 py-2 text-sm text-[#2f6b39]">
            {testResult}
          </p>
        ) : null}
        {testError ? (
          <p className="mt-3 rounded-xl border border-[#f3c8bb] bg-[#fff4ef] px-3 py-2 text-sm text-[#9e3f28]">
            {testError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
