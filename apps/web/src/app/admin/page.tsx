import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import type { LeadsResponse } from "@/lib/types";
import { LeadsDashboard } from "./LeadsDashboard";

export const metadata: Metadata = {
  title: "Admin - Leads Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  let data: LeadsResponse;
  try {
    data = await apiFetch<LeadsResponse>(
      "/admin/leads?page=1&page_size=50&sort_by=lead_score&sort_dir=desc"
    );
  } catch {
    return (
      <div className="py-12 text-center text-gray-500">
        Failed to load leads data. Is the API running?
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Leads Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Restaurants that may be interested in web hosting / online ordering
        services.
      </p>
      <LeadsDashboard initialData={data} />
    </div>
  );
}
