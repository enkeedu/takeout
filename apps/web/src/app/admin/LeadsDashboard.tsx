"use client";

import { useState, useEffect, useCallback } from "react";
import type { LeadsResponse, LeadItem, LeadStats, ChartEntry } from "@/lib/types";
import { STATE_NAMES } from "@/lib/states";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const SORT_OPTIONS = [
  { value: "lead_score", label: "Lead Score" },
  { value: "name", label: "Name" },
  { value: "state", label: "State" },
  { value: "estimated_monthly_spend", label: "Est. Spend" },
  { value: "rating", label: "Rating" },
] as const;

function ScoreBadge({ score }: { score: number }) {
  let color = "bg-gray-100 text-gray-700";
  if (score >= 9) color = "bg-red-100 text-red-800";
  else if (score >= 5) color = "bg-amber-100 text-amber-800";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}
    >
      {score}
    </span>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatsBar({ stats }: { stats: LeadStats }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label="Total Restaurants" value={stats.total_restaurants} />
      <StatCard label="No Website" value={stats.no_website_count} />
      <StatCard label="Broken Website" value={stats.broken_website_count} />
      <StatCard
        label="Avg Lead Score"
        value={stats.avg_lead_score.toFixed(1)}
      />
    </div>
  );
}

const BAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
];

const SCORE_COLORS: Record<string, string> = {
  "0-2": "bg-gray-400",
  "3-4": "bg-blue-400",
  "5-6": "bg-amber-400",
  "7-8": "bg-orange-500",
  "9+": "bg-red-500",
};

const STATUS_COLORS: Record<string, string> = {
  "Has website": "bg-emerald-500",
  "No website": "bg-red-500",
  "Broken": "bg-amber-500",
  "Has ordering": "bg-emerald-500",
  "No ordering": "bg-gray-400",
};

function HorizontalBarChart({
  title,
  entries,
  maxItems,
  colorMap,
}: {
  title: string;
  entries: ChartEntry[];
  maxItems?: number;
  colorMap?: Record<string, string>;
}) {
  const items = maxItems ? entries.slice(0, maxItems) : entries;
  const max = Math.max(...items.map((e) => e.value), 1);
  const total = items.reduce((s, e) => s + e.value, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((entry, i) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
          const barColor =
            colorMap?.[entry.label] || BAR_COLORS[i % BAR_COLORS.length];
          return (
            <div key={entry.label}>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="truncate">{entry.label}</span>
                <span className="ml-2 font-medium">
                  {entry.value} ({pct}%)
                </span>
              </div>
              <div className="mt-0.5 h-2 w-full rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full ${barColor}`}
                  style={{ width: `${(entry.value / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
        {entries.length === 0 && (
          <p className="text-xs text-gray-400">No data</p>
        )}
      </div>
    </div>
  );
}

function SegmentedBar({
  title,
  entries,
  colorMap,
}: {
  title: string;
  entries: ChartEntry[];
  colorMap?: Record<string, string>;
}) {
  const total = entries.reduce((s, e) => s + e.value, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {total > 0 ? (
        <>
          <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full">
            {entries.map((entry, i) => {
              const pct = (entry.value / total) * 100;
              if (pct === 0) return null;
              const color =
                colorMap?.[entry.label] || BAR_COLORS[i % BAR_COLORS.length];
              return (
                <div
                  key={entry.label}
                  className={`${color}`}
                  style={{ width: `${pct}%` }}
                  title={`${entry.label}: ${entry.value} (${pct.toFixed(0)}%)`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {entries.map((entry, i) => {
              const color =
                colorMap?.[entry.label] || BAR_COLORS[i % BAR_COLORS.length];
              const pct =
                total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
              return (
                <div key={entry.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
                  {entry.label}: {entry.value} ({pct}%)
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs text-gray-400">No data</p>
      )}
    </div>
  );
}

function Charts({ stats }: { stats: LeadStats }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <SegmentedBar
        title="Website Status"
        entries={stats.website_status}
        colorMap={STATUS_COLORS}
      />
      <SegmentedBar
        title="Online Ordering"
        entries={stats.ordering_counts}
        colorMap={STATUS_COLORS}
      />
      <HorizontalBarChart
        title="Lead Score Distribution"
        entries={stats.score_distribution}
        colorMap={SCORE_COLORS}
      />
      <HorizontalBarChart
        title="Top Platforms"
        entries={stats.platform_counts}
        maxItems={8}
      />
    </div>
  );
}

function LeadsTable({
  items,
  loading,
}: {
  items: LeadItem[];
  loading: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">
              Name
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">
              Location
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">
              Phone
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">
              Website
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">
              Platform
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gray-600">
              Ordering
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gray-600">
              Score
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">
              Est. Spend
            </th>
          </tr>
        </thead>
        <tbody className={`divide-y divide-gray-100 ${loading ? "opacity-50" : ""}`}>
          {items.map((lead) => (
            <tr key={lead.restaurant_id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">
                <a
                  href={`/${lead.state_slug}/${lead.city_slug}/${lead.restaurant_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {lead.name}
                </a>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {lead.city}, {lead.state}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {lead.phone || <span className="text-gray-300">--</span>}
              </td>
              <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">
                {lead.website_url ? (
                  <a
                    href={lead.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {lead.website_url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 30)}
                  </a>
                ) : (
                  <span className="text-red-500 font-medium">None</span>
                )}
                {lead.audit_error && (
                  <span className="ml-1 text-xs text-red-500" title={lead.audit_error}>
                    (broken)
                  </span>
                )}
                {lead.http_status && lead.http_status >= 400 && (
                  <span className="ml-1 text-xs text-red-500">
                    ({lead.http_status})
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {lead.platform || <span className="text-gray-300">--</span>}
              </td>
              <td className="px-4 py-3 text-center">
                {lead.has_online_ordering ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-gray-400">No</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <ScoreBadge score={lead.lead_score} />
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">
                {lead.estimated_monthly_spend > 0
                  ? `$${lead.estimated_monthly_spend}/mo`
                  : <span className="text-gray-300">--</span>}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                No leads found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  initialData: LeadsResponse;
}

export function LeadsDashboard({ initialData }: Props) {
  const [data, setData] = useState<LeadsResponse>(initialData);
  const [stateFilter, setStateFilter] = useState("");
  const [sortBy, setSortBy] = useState("lead_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      page_size: "50",
      sort_by: sortBy,
      sort_dir: sortDir,
    });
    if (stateFilter) params.set("state", stateFilter);

    try {
      const res = await fetch(`${API_URL}/admin/leads?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
    setLoading(false);
  }, [page, sortBy, sortDir, stateFilter]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchLeads();
  }, [mounted, fetchLeads]);

  function handleExportCsv() {
    const params = new URLSearchParams({
      sort_by: sortBy,
      sort_dir: sortDir,
    });
    if (stateFilter) params.set("state", stateFilter);
    window.open(`${API_URL}/admin/leads/csv?${params}`, "_blank");
  }

  const { stats } = data;

  return (
    <div>
      <StatsBar stats={stats} />
      <Charts stats={stats} />

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All States</option>
          {Object.entries(STATE_NAMES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          {sortDir === "desc" ? "Desc" : "Asc"}
        </button>

        <button
          onClick={handleExportCsv}
          className="ml-auto rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="mt-4">
        <LeadsTable items={data.items} loading={loading} />
      </div>

      {/* Pagination */}
      {data.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {data.page} of {data.total_pages} ({data.total} restaurants)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page >= data.total_pages}
              className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
