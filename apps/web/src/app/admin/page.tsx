import type { Metadata } from "next";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  AdminClaimQueueResponse,
  AdminDiagnostics,
  AdminUnlistedOwnerRequestResponse,
  LeadsResponse,
} from "@/lib/types";
import { AdminReadinessPanel } from "./AdminReadinessPanel";
import { LeadsDashboard } from "./LeadsDashboard";
import { LaunchQueuePanel } from "./LaunchQueuePanel";
import { UnlistedRequestsPanel } from "./UnlistedRequestsPanel";

export const metadata: Metadata = {
  title: "Admin - Website Activation Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const adminToken =
    process.env.ADMIN_TOKEN || process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
  const internalApiUrl = process.env.INTERNAL_API_URL || "http://localhost:8001";

  let data: LeadsResponse;
  let claimQueue: AdminClaimQueueResponse;
  let unlistedRequests: AdminUnlistedOwnerRequestResponse;
  let diagnostics: AdminDiagnostics;
  try {
    const headers = adminToken ? { "X-Admin-Token": adminToken } : undefined;
    [data, claimQueue, unlistedRequests, diagnostics] = await Promise.all([
      apiFetch<LeadsResponse>(
        "/admin/leads?page=1&page_size=50&sort_by=lead_score&sort_dir=desc",
        headers ? { headers } : undefined
      ),
      apiFetch<AdminClaimQueueResponse>(
        "/admin/claim-requests",
        headers ? { headers } : undefined
      ),
      apiFetch<AdminUnlistedOwnerRequestResponse>(
        "/admin/unlisted-owner-requests",
        headers ? { headers } : undefined
      ),
      apiFetch<AdminDiagnostics>(
        "/admin/diagnostics",
        headers ? { headers } : undefined
      ),
    ]);
  } catch (error) {
    let message = "Failed to load leads data.";
    if (error instanceof ApiError) {
      if (error.status === 503) {
        message = "Admin token missing. Set ADMIN_TOKEN in web/api env, then restart both apps.";
      } else {
        message = `Failed to load leads data (${error.status}): ${error.detail}`;
      }
    }

    return (
      <div className="py-12 text-center text-gray-500">
        {message}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Leads Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Restaurants that may be interested in website activation and later
        online ordering services.
      </p>
      <AdminReadinessPanel
        diagnostics={diagnostics}
        webAdminTokenConfigured={Boolean(adminToken)}
        publicApiUrl={publicApiUrl}
        internalApiUrl={internalApiUrl}
      />
      <LeadsDashboard initialData={data} />
      <LaunchQueuePanel initialData={claimQueue} />
      <UnlistedRequestsPanel initialData={unlistedRequests} />
    </div>
  );
}
