"use client";

import type { AdminUnlistedOwnerRequestResponse } from "@/lib/types";

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

type Props = {
  initialData: AdminUnlistedOwnerRequestResponse;
};

export function UnlistedRequestsPanel({ initialData }: Props) {
  const items = initialData.items;

  return (
    <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Unlisted Owner Requests</h2>
        <p className="mt-1 text-sm text-gray-500">
          Owners who could not find a restaurant listing and asked to be added manually.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Restaurant</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Owner</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Links</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Source</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.request_id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-semibold text-gray-900">{item.restaurant_name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.city}, {item.state}
                  </p>
                  {item.restaurant_phone ? (
                    <p className="mt-1 text-xs text-gray-500">{item.restaurant_phone}</p>
                  ) : null}
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-amber-700">
                    {item.status}
                  </p>
                </td>
                <td className="px-4 py-4 text-gray-700">
                  <p className="font-medium text-gray-900">{item.owner_name}</p>
                  <p>{item.owner_phone}</p>
                  <p className="text-xs text-gray-500">{item.owner_email}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Preferred contact: {item.preferred_contact_method}
                  </p>
                  {item.notes ? (
                    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                      {item.notes}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 text-gray-700">
                  <div className="flex flex-col gap-2">
                    {item.website_url ? (
                      <a
                        href={item.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Website
                      </a>
                    ) : null}
                    {item.google_maps_url ? (
                      <a
                        href={item.google_maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Google Maps
                      </a>
                    ) : null}
                    {item.yelp_url ? (
                      <a
                        href={item.yelp_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Yelp
                      </a>
                    ) : null}
                    {!item.website_url && !item.google_maps_url && !item.yelp_url ? (
                      <span className="text-xs text-gray-400">No links provided</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-4 text-xs text-gray-500">
                  {item.source_path || "Direct intake"}
                </td>
                <td className="px-4 py-4 text-xs text-gray-500">
                  {formatSubmittedAt(item.created_at)}
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No unlisted owner requests yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
