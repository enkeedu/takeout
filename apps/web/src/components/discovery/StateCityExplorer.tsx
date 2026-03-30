"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import type { CityInfo } from "@/lib/types";

const TOP_CITY_COUNT = 6;
const INITIAL_VISIBLE_CITIES = 12;
const LOAD_MORE_STEP = 12;

type StateCityExplorerProps = {
  stateSlug: string;
  stateName: string;
  cities: CityInfo[];
  totalCities: number;
};

type CityOpportunityCardProps = {
  city: CityInfo;
  stateSlug: string;
};

type CompactCityRowProps = {
  city: CityInfo;
  stateSlug: string;
};

function getOpportunityLabel(score: number): string {
  if (score >= 220) return "Best Opportunity";
  if (score >= 140) return "High Opportunity";
  return "Growth Opportunity";
}

function formatCityOpportunity(city: CityInfo): string {
  const directOrderCount = city.no_online_ordering_count;
  const unclaimedCount = city.unclaimed_count;

  if (directOrderCount > 0 && unclaimedCount > 0) {
    return `${directOrderCount} can still capture direct orders, ${unclaimedCount} unclaimed listing${unclaimedCount === 1 ? "" : "s"}`;
  }
  if (directOrderCount > 0) {
    return `${directOrderCount} can still capture direct orders`;
  }
  if (unclaimedCount > 0) {
    return `${unclaimedCount} unclaimed listing${unclaimedCount === 1 ? "" : "s"}`;
  }
  return "Ready for owner launch review";
}

function sortCities(cities: CityInfo[], sortBy: "opportunity" | "alpha" | "count") {
  const sorted = [...cities];
  if (sortBy === "opportunity") {
    sorted.sort((a, b) => {
      if (b.opportunity_score !== a.opportunity_score) {
        return b.opportunity_score - a.opportunity_score;
      }
      return b.restaurant_count - a.restaurant_count;
    });
    return sorted;
  }
  if (sortBy === "count") {
    sorted.sort((a, b) => b.restaurant_count - a.restaurant_count);
    return sorted;
  }
  sorted.sort((a, b) => a.city.localeCompare(b.city));
  return sorted;
}

function CityOpportunityCard({ city, stateSlug }: CityOpportunityCardProps) {
  return (
    <Link
      href={`/${stateSlug}/${city.city_slug}`}
      data-analytics-event="discovery_result_click"
      data-analytics-payload={JSON.stringify({
        source: "state_top_city",
        result_type: "city",
        state_slug: stateSlug,
        city_slug: city.city_slug,
        opportunity_score: city.opportunity_score,
      })}
      className="group relative overflow-hidden rounded-2xl border border-[#e5d6c8] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#cc3f2f] hover:shadow-md active:scale-[0.99]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#cf4333] via-[#e07653] to-[#f5ba76]" />
      <div className="flex items-start justify-between gap-2">
        <p className="pr-2 text-2xl font-semibold leading-tight text-[#202020]">{city.city}</p>
        <span className="rounded-full bg-[#fff3eb] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#ac4a2f]">
          {getOpportunityLabel(city.opportunity_score)}
        </span>
      </div>

      <p className="mt-1 text-sm text-[#60554a]">
        {city.restaurant_count} restaurant{city.restaurant_count === 1 ? "" : "s"}
      </p>
      <p className="mt-1 text-sm text-[#7c6e61]">{formatCityOpportunity(city)}</p>

      <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#c0392b]">
        Open city opportunity
        <span className="transition-transform group-hover:translate-x-0.5">{"->"}</span>
      </div>
    </Link>
  );
}

function CompactCityRow({ city, stateSlug }: CompactCityRowProps) {
  return (
    <Link
      href={`/${stateSlug}/${city.city_slug}`}
      data-analytics-event="discovery_result_click"
      data-analytics-payload={JSON.stringify({
        source: "state_city_list",
        result_type: "city",
        state_slug: stateSlug,
        city_slug: city.city_slug,
        opportunity_score: city.opportunity_score,
      })}
      className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e7d9cb] bg-white px-4 py-3 shadow-sm transition-colors hover:border-[#cc3f2f] active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xl font-semibold leading-tight text-[#202020]">{city.city}</p>
          <span className="rounded-full bg-[#fff3eb] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ac4a2f]">
            {getOpportunityLabel(city.opportunity_score)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-[#60554a]">
          {city.restaurant_count} restaurant{city.restaurant_count === 1 ? "" : "s"}
        </p>
        <p className="mt-0.5 text-xs text-[#7c6e61]">{formatCityOpportunity(city)}</p>
      </div>
      <div className="inline-flex items-center gap-1 text-sm font-semibold text-[#c0392b]">
        Open city
        <span className="transition-transform group-hover:translate-x-0.5">{"->"}</span>
      </div>
    </Link>
  );
}

export function StateCityExplorer({
  stateSlug,
  stateName,
  cities,
  totalCities,
}: StateCityExplorerProps) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"opportunity" | "alpha" | "count">(
    "opportunity"
  );
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_CITIES);

  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  const filteredCities = useMemo(
    () =>
      hasQuery
        ? cities.filter((city) => city.city.toLowerCase().includes(normalizedQuery))
        : cities,
    [cities, hasQuery, normalizedQuery]
  );

  const sortedFilteredCities = useMemo(
    () => sortCities(filteredCities, sortBy),
    [filteredCities, sortBy]
  );

  const topOpportunityCities = useMemo(
    () => sortCities(filteredCities, "opportunity").slice(0, TOP_CITY_COUNT),
    [filteredCities]
  );

  const topOpportunitySlugs = useMemo(
    () => new Set(topOpportunityCities.map((city) => city.city_slug)),
    [topOpportunityCities]
  );

  const allCities = useMemo(() => {
    if (hasQuery) return sortedFilteredCities;
    return sortedFilteredCities.filter((city) => !topOpportunitySlugs.has(city.city_slug));
  }, [hasQuery, sortedFilteredCities, topOpportunitySlugs]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_CITIES);
  }, [query, sortBy]);

  useEffect(() => {
    if (sortedFilteredCities.length === 0) {
      trackEvent("discovery_empty_state_view", {
        surface: "state",
        state_slug: stateSlug,
        reason: "no_matching_cities",
        query: normalizedQuery || null,
      });
      return;
    }

    trackEvent("discovery_results_view", {
      surface: "state",
      state_slug: stateSlug,
      result_type: "city",
      visible_results: sortedFilteredCities.length,
      query: normalizedQuery || null,
      sort_by: sortBy,
    });
  }, [normalizedQuery, sortBy, sortedFilteredCities.length, stateSlug]);

  const visibleAllCities = allCities.slice(0, visibleCount);
  const hasMoreCities = visibleAllCities.length < allCities.length;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#decab8] bg-white p-5 shadow-sm md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b04a2d]">
          Step 1
        </p>
        <h2 className="font-[var(--font-display)] mt-1 text-3xl font-bold tracking-tight text-[#1f1f1f] md:text-4xl">
          Pick your city in {stateName}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5a534d] md:text-base">
          Start with top launch opportunities. If you already know your listing, jump
          to direct search.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href="/search"
            data-analytics-event="discovery_search_cta_click"
            data-analytics-payload={JSON.stringify({
              source: "state_step_search",
              state_slug: stateSlug,
            })}
            className="inline-flex rounded-xl bg-[#c73f2f] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#ad3324] active:scale-[0.99]"
          >
            Find My Restaurant
          </Link>
          <a
            href="tel:+18183420990"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "state_step_help",
              channel: "phone",
              state_slug: stateSlug,
            })}
            className="inline-flex rounded-xl border border-[#e2d4c4] px-4 py-2 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2]"
          >
            Book 15-min Setup Call
          </a>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7665]">
            English | Chinese support
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search city..."
            className="w-full rounded-xl border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#222] focus:border-[#cc3f2f] focus:outline-none focus:ring-2 focus:ring-[#f7d4cf]"
          />
          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as "opportunity" | "alpha" | "count")
            }
            className="rounded-xl border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#222] focus:border-[#cc3f2f] focus:outline-none focus:ring-2 focus:ring-[#f7d4cf]"
          >
            <option value="opportunity">Best Launch Opportunity</option>
            <option value="count">Most Restaurants</option>
            <option value="alpha">A-Z</option>
          </select>
        </div>

        <p className="mt-3 text-sm text-[#6f6155]">
          Showing {sortedFilteredCities.length} of {totalCities} cities.
        </p>
        <p aria-live="polite" className="sr-only">
          Showing {sortedFilteredCities.length} matching cities in {stateName}.
        </p>
      </section>

      {sortedFilteredCities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d8cdbf] bg-white p-8 text-center text-[#666]">
          No matching cities found.
        </div>
      ) : null}

      {sortedFilteredCities.length > 0 && !hasQuery ? (
        <>
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
              Recommended First
            </p>
            <h3 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-[#1f1f1f]">
              Top launch cities in {stateName}
            </h3>

            <section className="grid gap-3 md:grid-cols-2">
              {topOpportunityCities.map((city) => (
                <CityOpportunityCard
                  key={`top-${city.city_slug}`}
                  city={city}
                  stateSlug={stateSlug}
                />
              ))}
            </section>
          </section>

          <section className="rounded-2xl border border-[#e8d8c8] bg-[#fff8f1] p-5 shadow-sm md:flex md:items-center md:justify-between md:gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
                Fastest Path
              </p>
              <h3 className="mt-1 text-xl font-bold text-[#1f1f1f]">
                Know your listing? Skip city browsing.
              </h3>
              <p className="mt-1 text-sm text-[#65584d]">
                Search by restaurant name, city, state, ZIP, or address and jump
                straight to claim and launch.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
              <Link
                href="/search"
                data-analytics-event="discovery_search_cta_click"
                data-analytics-payload={JSON.stringify({
                  source: "state_mid_search",
                  state_slug: stateSlug,
                })}
                className="rounded-xl border border-[#e2d4c4] bg-white px-4 py-2 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2]"
              >
                Find My Restaurant
              </Link>
              <a
                href="tel:+18183420990"
                data-analytics-event="discovery_help_click"
                data-analytics-payload={JSON.stringify({
                  source: "state_mid_help",
                  channel: "phone",
                  state_slug: stateSlug,
                })}
                className="rounded-xl border border-[#e2d4c4] bg-white px-4 py-2 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2]"
              >
                Talk to a Human
              </a>
            </div>
          </section>
        </>
      ) : null}

      {visibleAllCities.length > 0 ? (
        <section className="space-y-3" id="all-cities">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
                {hasQuery ? "Search Results" : "More Cities"}
              </p>
              <h3 className="font-[var(--font-display)] mt-1 text-2xl font-bold tracking-tight text-[#1f1f1f]">
                {hasQuery
                  ? `${sortedFilteredCities.length} matching cit${sortedFilteredCities.length === 1 ? "y" : "ies"}`
                  : `${allCities.length} additional cities`}
              </h3>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7665]">
              Showing {visibleAllCities.length} of {allCities.length}
            </p>
          </div>

          <section className="space-y-2">
            {visibleAllCities.map((city) => (
              <CompactCityRow
                key={`all-${city.city_slug}`}
                city={city}
                stateSlug={stateSlug}
              />
            ))}
          </section>

          {hasMoreCities ? (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}
                className="rounded-xl border border-[#d8c7b6] bg-[#fff5ec] px-5 py-2 text-sm font-semibold text-[#884126] hover:bg-[#ffeede]"
              >
                Show {Math.min(LOAD_MORE_STEP, allCities.length - visibleAllCities.length)}{" "}
                more cities
              </button>
            </div>
          ) : (
            <p className="text-center text-xs uppercase tracking-[0.14em] text-[#8a7665]">
              You have reached the end of this city list.
            </p>
          )}
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#e8ddd2] bg-white p-5 shadow-sm md:flex md:items-center md:justify-between md:gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
            Missing a city?
          </p>
          <h3 className="font-[var(--font-display)] mt-1 text-2xl font-bold tracking-tight text-[#1f1f1f]">
            We can import it quickly.
          </h3>
          <p className="mt-1 text-sm text-[#666]">
            We can normalize your listing data and keep your launch timeline at 5-7 days.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-0">
          <Link
            href="/search"
            data-analytics-event="discovery_search_cta_click"
            data-analytics-payload={JSON.stringify({
              source: "state_add_city",
              state_slug: stateSlug,
            })}
            className="inline-flex rounded-lg border border-[#e2d4c4] bg-white px-4 py-2 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2]"
          >
            Find My Restaurant
          </Link>
          <a
            href="tel:+18183420990"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "state_missing_city_help",
              channel: "phone",
              state_slug: stateSlug,
            })}
            className="inline-flex rounded-lg border border-[#e2d4c4] px-4 py-2 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2]"
          >
            Book 15-min Setup Call
          </a>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7665]">
            English | Chinese
          </span>
        </div>
      </section>
    </div>
  );
}
