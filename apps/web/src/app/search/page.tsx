import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from "@/lib/discoveryJsonLd";
import { CORE_OWNER_PROMISE, OWNER_LAUNCH_STEPS } from "@/lib/ownerJourney";
import { SearchFiltersForm, type SearchFilters } from "@/components/SearchFiltersForm";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Pagination } from "@/components/Pagination";
import { DiscoveryJsonLd } from "@/components/discovery/DiscoveryJsonLd";
import { DiscoveryProofStrip } from "@/components/discovery/DiscoveryProofStrip";
import { DiscoveryRouteEvent } from "@/components/discovery/DiscoveryRouteEvent";
import type { PaginatedResponse, SearchResultItem, StateInfo } from "@/lib/types";

export const metadata: Metadata = {
  title: "Find My Restaurant",
  description:
    "Search by restaurant name, city, ZIP, address, or phone to find your listing and claim your restaurant website.",
  robots: { index: false },
};

function hasAnyFilter(filters: SearchFilters): boolean {
  return Object.values(filters).some((value) => value.trim().length > 0);
}

function buildApiSearchQuery(filters: SearchFilters, page: number): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.name.trim()) params.set("name", filters.name.trim());
  if (filters.phone.trim()) params.set("phone", filters.phone.trim());
  if (filters.city.trim()) params.set("city", filters.city.trim());
  if (filters.state.trim()) params.set("state", filters.state.trim().toUpperCase());
  if (filters.zip.trim()) params.set("zip", filters.zip.trim());
  if (filters.address.trim()) params.set("address", filters.address.trim());
  return params;
}

function buildPaginationParams(filters: SearchFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.q.trim()) params.q = filters.q.trim();
  if (filters.name.trim()) params.name = filters.name.trim();
  if (filters.phone.trim()) params.phone = filters.phone.trim();
  if (filters.city.trim()) params.city = filters.city.trim();
  if (filters.state.trim()) params.state = filters.state.trim().toUpperCase();
  if (filters.zip.trim()) params.zip = filters.zip.trim();
  if (filters.address.trim()) params.address = filters.address.trim();
  return params;
}

function getFilterChips(filters: SearchFilters) {
  const chips: Array<{ label: string; value: string }> = [];
  if (filters.q.trim()) chips.push({ label: "Keyword", value: filters.q.trim() });
  if (filters.name.trim()) chips.push({ label: "Name", value: filters.name.trim() });
  if (filters.phone.trim()) chips.push({ label: "Phone", value: filters.phone.trim() });
  if (filters.city.trim()) chips.push({ label: "City", value: filters.city.trim() });
  if (filters.state.trim()) {
    chips.push({ label: "State", value: filters.state.trim().toUpperCase() });
  }
  if (filters.zip.trim()) chips.push({ label: "ZIP", value: filters.zip.trim() });
  if (filters.address.trim()) {
    chips.push({ label: "Address", value: filters.address.trim() });
  }
  return chips;
}

function buildSearchUrl(filters: Partial<SearchFilters>, page?: number): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.name?.trim()) params.set("name", filters.name.trim());
  if (filters.phone?.trim()) params.set("phone", filters.phone.trim());
  if (filters.city?.trim()) params.set("city", filters.city.trim());
  if (filters.state?.trim()) params.set("state", filters.state.trim().toUpperCase());
  if (filters.zip?.trim()) params.set("zip", filters.zip.trim());
  if (filters.address?.trim()) params.set("address", filters.address.trim());
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

function buildNotListedUrl(filters: Partial<SearchFilters>): string {
  const params = new URLSearchParams();
  if (filters.name?.trim()) params.set("name", filters.name.trim());
  if (filters.city?.trim()) params.set("city", filters.city.trim());
  if (filters.state?.trim()) params.set("state", filters.state.trim().toUpperCase());
  if (filters.phone?.trim()) params.set("phone", filters.phone.trim());
  const query = params.toString();
  return query ? `/not-listed?${query}` : "/not-listed";
}

function buildSearchCollectionName(filters: SearchFilters) {
  const chips = getFilterChips(filters);
  if (chips.length === 0) return "Chinese restaurant owner listing search";
  return `Chinese restaurant search results for ${chips
    .map((chip) => `${chip.label}: ${chip.value}`)
    .join(", ")}`;
}

async function SearchResults({
  filters,
  page,
}: {
  filters: SearchFilters;
  page: number;
}) {
  if (!hasAnyFilter(filters)) {
    return (
      <section
        id="search-results"
        className="rounded-3xl border border-[#e4d5c6] bg-white p-6 shadow-sm md:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b64a30]">
          Step 1
        </p>
        <h2
          id="search-results-heading"
          tabIndex={-1}
          className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f] outline-none md:text-4xl"
        >
          Start with one search field
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-[#5f5851] md:text-base">
          {CORE_OWNER_PROMISE} Search by name, city, state, ZIP, address, or phone.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            {
              label: "A&W Seafood Restaurant",
              href: buildSearchUrl({ name: "A&W Seafood Restaurant" }),
            },
            { label: "Los Angeles, CA", href: buildSearchUrl({ city: "Los Angeles", state: "CA" }) },
            { label: "ZIP 90012", href: buildSearchUrl({ zip: "90012" }) },
            { label: "Phone 8183420990", href: buildSearchUrl({ phone: "8183420990" }) },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full border border-[#decfbd] bg-[#fff8f1] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#6f5a49] transition-colors hover:bg-[#fff0e4]"
            >
              Try: {item.label}
            </Link>
          ))}
        </div>
      </section>
    );
  }

  const query = buildApiSearchQuery(filters, page);
  const searchPath = buildSearchUrl(filters, page);
  const collectionJsonLd = buildCollectionPageJsonLd({
    name: buildSearchCollectionName(filters),
    description:
      "Search results for Chinese restaurant owners finding the correct listing to claim and manage their website.",
    path: searchPath,
  });

  let data: PaginatedResponse<SearchResultItem>;
  try {
    data = await apiFetch<PaginatedResponse<SearchResultItem>>(
      `/search?${query.toString()}`
    );
  } catch {
    return (
      <section
        id="search-results"
        className="rounded-3xl border border-[#e4d5c6] bg-white p-6 shadow-sm md:p-8"
      >
        <DiscoveryJsonLd data={collectionJsonLd} />
        <DiscoveryRouteEvent
          eventName="discovery_empty_state_view"
          payload={{ surface: "search", reason: "api_error" }}
          focusTargetId="search-results-heading"
          liveMessage="Search results could not be loaded."
        />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b64a30]">
          Temporary Search Issue
        </p>
        <h2
          id="search-results-heading"
          tabIndex={-1}
          className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f] outline-none md:text-4xl"
        >
          We could not load search results
        </h2>
        <p className="mt-3 text-sm text-[#5f5851] md:text-base">
          Retry the same search, or talk to a human and we will help you continue your
          website claim quickly.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={searchPath}
            className="rounded-xl bg-[#c73f2f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ad3324]"
          >
            Retry Search
          </Link>
          <a
            href="tel:+18183420990"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "search_error",
              channel: "phone",
            })}
            className="rounded-xl border border-[#decfbd] bg-white px-4 py-2 text-sm font-semibold text-[#6f5a49] transition-colors hover:bg-[#fff8f2]"
          >
            Call Support
          </a>
          <a
            href="https://wa.me/18183420990"
            target="_blank"
            rel="noreferrer"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "search_error",
              channel: "whatsapp",
            })}
            className="rounded-xl border border-[#decfbd] bg-white px-4 py-2 text-sm font-semibold text-[#6f5a49] transition-colors hover:bg-[#fff8f2]"
          >
            WhatsApp Support
          </a>
        </div>
      </section>
    );
  }

  const chips = getFilterChips(filters);

  if (data.items.length === 0) {
    return (
      <section
        id="search-results"
        className="rounded-3xl border border-[#e4d5c6] bg-white p-6 shadow-sm md:p-8"
      >
        <DiscoveryJsonLd data={collectionJsonLd} />
        <DiscoveryRouteEvent
          eventName="discovery_empty_state_view"
          payload={{
            surface: "search",
            reason: "no_results",
            page,
            filter_count: chips.length,
          }}
          focusTargetId="search-results-heading"
          liveMessage="No restaurants matched your search."
        />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b64a30]">
          No Match Yet
        </p>
        <h2
          id="search-results-heading"
          tabIndex={-1}
          className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f] outline-none md:text-4xl"
        >
          We could not find that restaurant
        </h2>
        <p className="mt-3 text-sm text-[#5f5851] md:text-base">
          Try relaxing one field, switching to phone search, or search using just name,
          city, state, ZIP, or address.
        </p>

        {chips.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={`${chip.label}-${chip.value}`}
                className="rounded-full border border-[#e1d4c4] bg-[#fff8f1] px-3 py-1.5 text-xs font-semibold text-[#6c5b4b]"
              >
                {chip.label}: {chip.value}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/search"
            className="rounded-xl bg-[#c73f2f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ad3324]"
          >
            Clear and Search Again
          </Link>
          <Link
            href={buildNotListedUrl(filters)}
            className="rounded-xl border border-[#decfbd] bg-[#fff8f2] px-4 py-2 text-sm font-semibold text-[#6f5a49] transition-colors hover:bg-[#fff1e8]"
          >
            Restaurant Not Listed?
          </Link>
          <a
            href="tel:+18183420990"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "search_empty_state",
              channel: "phone",
            })}
            className="rounded-xl border border-[#decfbd] bg-white px-4 py-2 text-sm font-semibold text-[#6f5a49] transition-colors hover:bg-[#fff8f2]"
          >
            Talk to a Human
          </a>
          <a
            href="https://wa.me/18183420990"
            target="_blank"
            rel="noreferrer"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "search_empty_state",
              channel: "whatsapp",
            })}
            className="rounded-xl border border-[#decfbd] bg-white px-4 py-2 text-sm font-semibold text-[#6f5a49] transition-colors hover:bg-[#fff8f2]"
          >
            WhatsApp Support
          </a>
        </div>
      </section>
    );
  }

  const itemListJsonLd = buildItemListJsonLd({
    name: buildSearchCollectionName(filters),
    items: data.items.map((item) => ({
      name: item.name,
      path: `/${item.state_slug}/${item.city_slug}/${item.restaurant_slug}`,
    })),
  });

  return (
    <div className="space-y-5" id="search-results">
      <DiscoveryJsonLd data={collectionJsonLd} />
      <DiscoveryJsonLd data={itemListJsonLd} />

      <section className="rounded-2xl border border-[#e5d7c7] bg-white p-5 shadow-sm">
        <DiscoveryRouteEvent
          eventName="discovery_results_view"
          payload={{
            surface: "search",
            page,
            result_count: data.total,
            visible_results: data.items.length,
            filter_count: chips.length,
          }}
          focusTargetId="search-results-heading"
          liveMessage={`${data.total} restaurants matched your search.`}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
              Step 2
            </p>
            <h2
              id="search-results-heading"
              tabIndex={-1}
              className="mt-1 text-lg font-semibold text-[#1f1f1f] outline-none"
            >
              {data.total} restaurant{data.total !== 1 ? "s" : ""} matched
            </h2>
            <p className="text-sm text-[#6d6258]">
              Open your listing and continue with website claim and setup.
            </p>
          </div>
          <a
            href="tel:+18183420990"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "search_results_header",
              channel: "phone",
            })}
            className="rounded-xl border border-[#decfbd] bg-[#fff8f2] px-4 py-2 text-sm font-semibold text-[#6f5a49] transition-colors hover:bg-[#fff1e8]"
          >
            Need help? Call now
          </a>
        </div>

        {chips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={`${chip.label}-${chip.value}`}
                className="rounded-full border border-[#e1d4c4] bg-[#fff8f1] px-3 py-1.5 text-xs font-semibold text-[#6c5b4b]"
              >
                {chip.label}: {chip.value}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {data.items.map((item) => (
            <RestaurantCard
              key={`${item.state_slug}/${item.city_slug}/${item.restaurant_slug}`}
              {...item}
            />
          ))}
        </div>

        <aside className="rounded-2xl border border-[#e5d7c7] bg-white p-5 shadow-sm xl:sticky xl:top-24 xl:h-fit">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
            Owner Checklist
          </p>
          <ol className="mt-3 space-y-2 text-sm text-[#5f5851]">
            <li>1. Open the listing that matches your phone and address.</li>
            <li>2. Claim the listing so we can use the right business data.</li>
            <li>3. Confirm the website details and publish a stronger web presence.</li>
          </ol>
          <div className="mt-4 rounded-xl border border-[#ecdccc] bg-[#fff8f1] p-3 text-xs text-[#6b5f54]">
            Transparent pricing: $299 setup + $99/month.
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/not-listed"
              className="rounded-lg border border-[#decfbd] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#6f5a49] transition-colors hover:bg-[#fff8f2]"
            >
              Not Listed?
            </Link>
            <a
              href="tel:+18183420990"
              data-analytics-event="discovery_help_click"
              data-analytics-payload={JSON.stringify({
                source: "search_results_sidebar",
                channel: "phone",
              })}
              className="rounded-lg border border-[#decfbd] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#6f5a49] transition-colors hover:bg-[#fff8f2]"
            >
              Call
            </a>
            <a
              href="https://wa.me/18183420990"
              target="_blank"
              rel="noreferrer"
              data-analytics-event="discovery_help_click"
              data-analytics-payload={JSON.stringify({
                source: "search_results_sidebar",
                channel: "whatsapp",
              })}
              className="rounded-lg border border-[#decfbd] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#6f5a49] transition-colors hover:bg-[#fff8f2]"
            >
              WhatsApp
            </a>
          </div>
        </aside>
      </div>

      <Pagination
        currentPage={data.page}
        totalPages={data.total_pages}
        basePath="/search"
        queryParams={buildPaginationParams(filters)}
      />
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    name?: string;
    phone?: string;
    city?: string;
    state?: string;
    zip?: string;
    address?: string;
    page?: string;
    claim?: string;
  }>;
}) {
  const params = await searchParams;
  const filters: SearchFilters = {
    q: params.q || "",
    name: params.name || "",
    phone: params.phone || "",
    city: params.city || "",
    state: params.state || "",
    zip: params.zip || "",
    address: params.address || "",
  };

  const parsedPage = parseInt(params.page || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const showClaimRecovery = params.claim === "1";

  let states: StateInfo[] = [];
  try {
    states = await apiFetch<StateInfo[]>("/browse/states");
  } catch {
    states = [];
  }

  const totalRestaurants = states.reduce(
    (sum, item) => sum + item.restaurant_count,
    0
  );
  const formatNumber = new Intl.NumberFormat("en-US");

  return (
    <div className="space-y-6">
      {showClaimRecovery ? (
        <section className="rounded-2xl border border-[#f0cbbc] bg-[#fff4ef] px-4 py-3 text-sm text-[#704b3a]">
          Claim flow needs a restaurant context. Search and select your listing to continue.
        </section>
      ) : null}

      <section className="relative overflow-hidden rounded-3xl border border-[#deccb8] bg-gradient-to-br from-[#fff8f1] via-[#fffdfb] to-[#f9efe4] p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ffd6ba]/35 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-[#f8c3a8]/20 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b04a2d]">
              Owner Listing Search
            </p>
            <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f] md:text-5xl">
              Find your restaurant in under 30 seconds
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#5a534d] md:text-base">
              {CORE_OWNER_PROMISE} Search by name, city, state, ZIP, address, or
              phone and open the right listing fast.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {OWNER_LAUNCH_STEPS.map((step, index) => (
                <p
                  key={step}
                  className="rounded-xl border border-[#ead9c8] bg-white px-3 py-2 text-xs uppercase tracking-[0.1em] text-[#6d5e51]"
                >
                  <span className="font-semibold text-[#2f251e]">{index + 1}.</span> {step}
                </p>
              ))}
            </div>

            <div className="mt-5">
              <SearchFiltersForm initial={filters} />
            </div>
          </div>

          <aside className="rounded-2xl border border-[#e2d3c3] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
              Fastest Search Paths
            </p>
            <ul className="mt-3 space-y-3 text-sm text-[#4f4b46]">
              <li>Restaurant name if you know the exact listing.</li>
              <li>Phone number if the name spelling varies.</li>
              <li>ZIP or street address when multiple locations are similar.</li>
            </ul>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl border border-[#eadccf] bg-[#fff9f3] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8d7a66]">Directory</p>
                <p className="mt-1 text-lg font-bold text-[#1f1f1f]">
                  {totalRestaurants ? formatNumber.format(totalRestaurants) : "7,000+"}
                </p>
              </div>
              <div className="rounded-xl border border-[#eadccf] bg-[#fff9f3] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8d7a66]">Support</p>
                <p className="mt-1 text-lg font-bold text-[#1f1f1f]">English | Chinese</p>
              </div>
              <div className="rounded-xl border border-[#eadccf] bg-[#fff9f3] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8d7a66]">Website Setup</p>
                <p className="mt-1 text-lg font-bold text-[#1f1f1f]">5-7 days</p>
              </div>
              <div className="rounded-xl border border-[#eadccf] bg-[#fff9f3] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8d7a66]">Starting at</p>
                <p className="mt-1 text-lg font-bold text-[#1f1f1f]">$299 setup</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <DiscoveryProofStrip
        eyebrow="Why Owners Start Here"
        items={[
          {
            label: "Directory Coverage",
            value: totalRestaurants
              ? `${formatNumber.format(totalRestaurants)} listings`
              : "7,000+ listings",
          },
          { label: "Pricing", value: "$299 setup + $99/month" },
          { label: "Website Timeline", value: "Go live in 5-7 days" },
          { label: "Support", value: "English | Chinese | Human help" },
        ]}
      />

      <SearchResults filters={filters} page={page} />
    </div>
  );
}
