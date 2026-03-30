"use client";

import { useState } from "react";
import type { AdminClaimQueueItem, AdminClaimQueueResponse } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";

type QueueAction =
  | "approve_manual_review"
  | "mark_kickoff_scheduled"
  | "mark_kickoff_confirmed"
  | "mark_build_in_progress"
  | "mark_review_ready"
  | "mark_live";

const REVIEW_ISSUE_LABELS: Record<string, string> = {
  branding_photos: "Branding / photos",
  menu_pricing: "Menu / pricing",
  hours_contact: "Hours / contact",
  fulfillment_ordering: "Ordering flow",
  links_cta: "Links / CTA",
};

const SETUP_STATUS_LABELS: Record<string, string> = {
  ready: "Ready",
  need_help: "Need help",
  not_sure: "Not sure",
  have_access: "Have access",
  no_domain_yet: "No domain yet",
  partial: "Partial",
  not_applicable: "Not applicable",
  call: "Call",
  text: "Text",
  whatsapp: "WhatsApp",
  email: "Email",
};

function formatSubmittedAt(iso: string) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "Unknown";
  return value.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function nextAction(item: AdminClaimQueueItem): { label: string; action: QueueAction } | null {
  if (item.verification_status === "manual_review_requested") {
    return { label: "Approve Ownership", action: "approve_manual_review" };
  }
  if (item.setup_deposit_state === "paid" && item.kickoff_state === "pending") {
    return { label: "Schedule Kickoff", action: "mark_kickoff_scheduled" };
  }
  if (item.kickoff_state === "scheduled") {
    return { label: "Confirm Kickoff", action: "mark_kickoff_confirmed" };
  }
  if (item.kickoff_state === "confirmed" && item.status !== "build_in_progress" && item.status !== "ready_for_review" && item.status !== "live") {
    return { label: "Start Build", action: "mark_build_in_progress" };
  }
  if (item.status === "build_in_progress") {
    return { label: "Ready For Review", action: "mark_review_ready" };
  }
  if (item.status === "changes_requested") {
    return { label: "Ready For Review", action: "mark_review_ready" };
  }
  if (item.status === "approved_for_launch") {
    return { label: "Mark Live", action: "mark_live" };
  }
  return null;
}

function reviewStateLabel(value: string) {
  switch (value) {
    case "pending":
      return "Waiting on owner review";
    case "changes_requested":
      return "Changes requested";
    case "approved":
      return "Approved by owner";
    default:
      return value.replace(/_/g, " ");
  }
}

function setupValue(item: AdminClaimQueueItem, key: string): string | null {
  const summary = item.setup_intake_summary;
  if (!summary) return null;
  const camelValue = (summary as Record<string, string | null | undefined>)[key];
  if (camelValue) return camelValue;
  const snakeKey = key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
  return (summary as Record<string, string | null | undefined>)[snakeKey] || null;
}

function setupLabel(value: string | null) {
  if (!value) return null;
  return SETUP_STATUS_LABELS[value] || value.replace(/_/g, " ");
}

type LaunchQueuePanelProps = {
  initialData: AdminClaimQueueResponse;
};

export function LaunchQueuePanel({ initialData }: LaunchQueuePanelProps) {
  const [items, setItems] = useState(initialData.items);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(item: AdminClaimQueueItem) {
    const actionConfig = nextAction(item);
    if (!actionConfig) return;
    setBusyId(item.claim_request_id);
    setError(null);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (ADMIN_TOKEN) headers["X-Admin-Token"] = ADMIN_TOKEN;
      const response = await fetch(
        `${API_URL}/admin/claim-requests/${encodeURIComponent(item.claim_request_id)}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ action: actionConfig.action }),
        }
      );
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Admin update failed.");
      }
      const updated = (await response.json()) as AdminClaimQueueItem;
      setItems((current) =>
        current.map((entry) =>
          entry.claim_request_id === updated.claim_request_id ? updated : entry
        )
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Admin update failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Launch Queue</h2>
          <p className="mt-1 text-sm text-gray-500">
            Claim requests that need approval, kickoff, build, review, or launch updates.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Restaurant</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Owner</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Setup Intake</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Billing</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Submitted</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const actionConfig = nextAction(item);
              return (
                <tr key={item.claim_request_id} className="align-top">
                  <td className="px-4 py-4">
                    <a
                      href={`/${item.state_slug}/${item.city_slug}/${item.restaurant_slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {item.restaurant_name}
                    </a>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.restaurant_city}, {item.restaurant_state}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Template: {item.template_key}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    <p className="font-medium text-gray-900">{item.owner_name}</p>
                    <p>{item.owner_phone}</p>
                    <p className="text-xs text-gray-500">{item.owner_email}</p>
                    {item.manual_review_reason ? (
                      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                        {item.manual_review_reason}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    <p className="font-medium text-gray-900">{item.status_label}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.status_detail}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      Verification: {item.verification_status.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-500">
                      Kickoff: {item.kickoff_state.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-500">
                      Review: {reviewStateLabel(item.review_state)}
                    </p>
                    {item.review_issue_areas.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.review_issue_areas.map((issueArea) => (
                          <span
                            key={issueArea}
                            className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900"
                          >
                            {REVIEW_ISSUE_LABELS[issueArea] || issueArea.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {item.review_notes ? (
                      <p className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-600">
                        {item.review_notes}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    <p className="font-medium text-gray-900">
                      {item.setup_intake_status === "submitted" ? "Submitted" : "Missing"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.setup_intake_status === "submitted"
                        ? "Kickoff details are saved for support."
                        : "Owner still needs to save kickoff details."}
                    </p>
                    {item.setup_intake_summary ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[
                          ["Google", setupLabel(setupValue(item, "googleBusinessProfileStatus"))],
                          ["Yelp", setupLabel(setupValue(item, "yelpStatus"))],
                          ["Domain", setupLabel(setupValue(item, "domainStatus"))],
                          ["Assets", setupLabel(setupValue(item, "logoPhotosStatus"))],
                          ["POS", setupLabel(setupValue(item, "posPaymentStatus"))],
                        ]
                          .filter(([, value]) => Boolean(value))
                          .map(([label, value]) => (
                            <span
                              key={`${label}-${value}`}
                              className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-900"
                            >
                              {label}: {value}
                            </span>
                          ))}
                      </div>
                    ) : null}
                    {setupValue(item, "setupNotes") ? (
                      <p className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-600">
                        {setupValue(item, "setupNotes")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    <p className="font-medium capitalize text-gray-900">
                      {item.setup_deposit_state.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.payment_unlocked ? "Payment unlocked" : "Payment locked"}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    <p>{formatSubmittedAt(item.submitted_at)}</p>
                    {item.kickoff_scheduled_for ? (
                      <p className="mt-1 text-xs text-gray-500">
                        Kickoff: {formatSubmittedAt(item.kickoff_scheduled_for)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {actionConfig ? (
                      <button
                        type="button"
                        onClick={() => runAction(item)}
                        disabled={busyId === item.claim_request_id}
                        className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-gray-800 disabled:opacity-60"
                      >
                        {busyId === item.claim_request_id ? "Updating..." : actionConfig.label}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">No action</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No claim requests yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
