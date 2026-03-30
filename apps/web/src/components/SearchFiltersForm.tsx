"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { trackEvent } from "@/lib/analytics";

export type SearchFilters = {
  q: string;
  name: string;
  phone: string;
  state: string;
  city: string;
  zip: string;
  address: string;
};

type SearchFiltersFormProps = {
  initial: SearchFilters;
};

function buildQueryParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  const normalized: SearchFilters = {
    q: filters.q.trim(),
    name: filters.name.trim(),
    phone: filters.phone.trim(),
    state: filters.state.trim().toUpperCase(),
    city: filters.city.trim(),
    zip: filters.zip.trim(),
    address: filters.address.trim(),
  };

  if (normalized.q) params.set("q", normalized.q);
  if (normalized.name) params.set("name", normalized.name);
  if (normalized.phone) params.set("phone", normalized.phone);
  if (normalized.state) params.set("state", normalized.state);
  if (normalized.city) params.set("city", normalized.city);
  if (normalized.zip) params.set("zip", normalized.zip);
  if (normalized.address) params.set("address", normalized.address);
  return params;
}

export function SearchFiltersForm({ initial }: SearchFiltersFormProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>(initial);
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(
    Boolean(
      initial.name.trim() ||
        initial.phone.trim() ||
        initial.state.trim() ||
        initial.city.trim() ||
        initial.zip.trim() ||
        initial.address.trim()
    )
  );

  const update =
    (field: keyof SearchFilters) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, [field]: event.target.value }));
    };

  function navigateToFilters(nextFilters: SearchFilters) {
    const params = buildQueryParams(nextFilters);
    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `/search?${queryString}` : "/search");
    });
  }

  function applyQuickQuery(next: Partial<SearchFilters>) {
    const merged: SearchFilters = { ...filters, ...next };
    trackEvent("discovery_search_submit_start", {
      source: "advanced_quick_chip",
      query: merged.q.trim(),
      name: merged.name.trim(),
      phone: merged.phone.trim(),
      city: merged.city.trim(),
      state: merged.state.trim().toUpperCase(),
      zip: merged.zip.trim(),
      address: merged.address.trim(),
    });
    navigateToFilters(merged);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    trackEvent("discovery_search_submit_start", {
      source: "search_page_form",
      query: filters.q.trim(),
      name: filters.name.trim(),
      phone: filters.phone.trim(),
      city: filters.city.trim(),
      state: filters.state.trim().toUpperCase(),
      zip: filters.zip.trim(),
      address: filters.address.trim(),
    });
    navigateToFilters(filters);
  }

  function handleClear() {
    setFilters({
      q: "",
      name: "",
      phone: "",
      state: "",
      city: "",
      zip: "",
      address: "",
    });
    startTransition(() => {
      router.push("/search");
    });
  }

  return (
    <form
      id="search-form"
      onSubmit={handleSubmit}
      aria-busy={isPending}
      className="space-y-4"
    >
      <div className="rounded-2xl border border-[#d8cab8] bg-white p-2 shadow-sm">
        <div className="flex items-center gap-2 rounded-xl border border-[#efe3d7] bg-[#fffdfa] px-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-[#8f7c6c]"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="M20 20L16.6 16.6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            value={filters.q}
            onChange={update("q")}
            placeholder="Restaurant name, city, ZIP, address, or phone"
            className="h-12 flex-1 border-none bg-transparent px-1 text-base text-[#1f1f1f] placeholder:text-[#78716a] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#c83f2f] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#af3526] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                Searching...
              </>
            ) : (
              "Find My Restaurant"
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          aria-expanded={showFilters}
          aria-controls="advanced-search-filters"
          className="rounded-full border border-[#d8cbbb] bg-white px-3 py-1.5 font-semibold uppercase tracking-[0.12em] text-[#6d5b4b] hover:bg-[#fff8f2]"
        >
          {showFilters ? "Hide Filters" : "Search by Field"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={isPending}
          className="rounded-full border border-[#d8cbbb] bg-white px-3 py-1.5 font-semibold uppercase tracking-[0.12em] text-[#6d5b4b] hover:bg-[#fff8f2]"
        >
          Clear
        </button>
        <p className="text-[11px] text-[#756a5f]">
          English | Chinese support. Start with one field, then add filters only if you need them.
        </p>
      </div>

      <div
        id="advanced-search-filters"
        className={`grid overflow-hidden transition-all duration-300 ${
          showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">
          <div className="rounded-2xl border border-[#e3d5c5] bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6e58]">
                  Restaurant Name
                </span>
                <input
                  type="text"
                  value={filters.name}
                  onChange={update("name")}
                  placeholder="A&W Seafood Restaurant"
                  className="w-full rounded-lg border border-[#d7cabc] px-3 py-2 text-sm focus:border-[#c64534] focus:outline-none focus:ring-2 focus:ring-[#f4d7d2]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6e58]">
                  Phone
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={filters.phone}
                  onChange={update("phone")}
                  placeholder="(818) 342-0990"
                  className="w-full rounded-lg border border-[#d7cabc] px-3 py-2 text-sm focus:border-[#c64534] focus:outline-none focus:ring-2 focus:ring-[#f4d7d2]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6e58]">
                  City
                </span>
                <input
                  type="text"
                  value={filters.city}
                  onChange={update("city")}
                  placeholder="Los Angeles"
                  className="w-full rounded-lg border border-[#d7cabc] px-3 py-2 text-sm focus:border-[#c64534] focus:outline-none focus:ring-2 focus:ring-[#f4d7d2]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6e58]">
                  State
                </span>
                <input
                  type="text"
                  value={filters.state}
                  onChange={update("state")}
                  placeholder="CA"
                  className="w-full rounded-lg border border-[#d7cabc] px-3 py-2 text-sm focus:border-[#c64534] focus:outline-none focus:ring-2 focus:ring-[#f4d7d2]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6e58]">
                  ZIP
                </span>
                <input
                  type="text"
                  value={filters.zip}
                  onChange={update("zip")}
                  placeholder="90012"
                  className="w-full rounded-lg border border-[#d7cabc] px-3 py-2 text-sm focus:border-[#c64534] focus:outline-none focus:ring-2 focus:ring-[#f4d7d2]"
                />
              </label>
              <label className="space-y-1 md:col-span-2 lg:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6e58]">
                  Street Address
                </span>
                <input
                  type="text"
                  value={filters.address}
                  onChange={update("address")}
                  placeholder="7213 Reseda Blvd"
                  className="w-full rounded-lg border border-[#d7cabc] px-3 py-2 text-sm focus:border-[#c64534] focus:outline-none focus:ring-2 focus:ring-[#f4d7d2]"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: "A&W Seafood Restaurant", q: "A&W Seafood Restaurant" },
          { label: "Los Angeles, CA", q: "Los Angeles CA" },
          { label: "ZIP 90012", zip: "90012", q: "" },
          { label: "Phone 8183420990", phone: "8183420990", q: "" },
          { label: "San Diego", city: "San Diego", state: "CA", q: "" },
        ].map((quick) => (
          <button
            key={quick.label}
            type="button"
            disabled={isPending}
            onClick={() =>
              applyQuickQuery({
                q: quick.q ?? "",
                phone: quick.phone ?? "",
                city: quick.city ?? "",
                state: quick.state ?? "",
                zip: quick.zip ?? "",
              })
            }
            className="rounded-full border border-[#d8cbbb] bg-[#fff8f2] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#6d5b4b] hover:bg-[#fff1e8]"
          >
            {quick.label}
          </button>
        ))}
        <a
          href="tel:+18183420990"
          data-analytics-event="discovery_help_click"
          data-analytics-payload={JSON.stringify({
            source: "search_page_quick_help",
            channel: "phone",
          })}
          className="rounded-full border border-[#d8cbbb] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#6d5b4b] hover:bg-[#fff8f2]"
        >
          Talk to a Human
        </a>
      </div>
    </form>
  );
}
