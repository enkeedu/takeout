"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildClaimHref, buildListingHref } from "@/lib/claim";
import { trackEvent } from "@/lib/analytics";
import { DiscoveryRating } from "@/components/DiscoveryRating";
import type { RestaurantListItem } from "@/lib/types";

type CityRestaurantExplorerProps = {
  restaurants: RestaurantListItem[];
};

type CityListingCardProps = {
  restaurant: RestaurantListItem;
};

function restaurantOpportunityScore(restaurant: RestaurantListItem): number {
  const missingWebsite = !(restaurant.website_url && restaurant.website_url.trim().length > 0);
  let score = 0;
  if (!restaurant.is_claimed) score += 3;
  if (!restaurant.has_online_ordering) score += 2;
  if (missingWebsite) score += 1;
  score += Math.max(0, restaurant.lead_score || 0) / 100;
  return score;
}

function CityListingCard({ restaurant }: CityListingCardProps) {
  const hasWebsite = Boolean(restaurant.website_url && restaurant.website_url.trim().length > 0);
  const isClaimed = Boolean(restaurant.is_claimed);
  const ctaLabel = isClaimed ? "View Listing" : "Preview Website";
  const ctaHref = isClaimed
    ? buildListingHref({
        stateSlug: restaurant.state_slug,
        citySlug: restaurant.city_slug,
        restaurantSlug: restaurant.restaurant_slug,
      })
    : buildClaimHref({
        stateSlug: restaurant.state_slug,
        citySlug: restaurant.city_slug,
        restaurantSlug: restaurant.restaurant_slug,
        templateKey: "local-order",
      });

  return (
    <article className="flex h-full flex-col rounded-[26px] border border-[#e8ddd2] bg-gradient-to-br from-white via-white to-[#fff8f3] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#d33f2f] hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            isClaimed ? "bg-[#f5f5f5] text-[#666]" : "bg-[#fff3df] text-[#8a5300]"
          }`}
        >
          {isClaimed ? "Claimed" : "Unclaimed"}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            hasWebsite ? "bg-[#eff8ff] text-[#20548c]" : "bg-[#fff1f0] text-[#b93d2f]"
          }`}
        >
          {hasWebsite ? "Website Found" : "No Website"}
        </span>
        {!restaurant.has_online_ordering ? (
          <span className="rounded-full bg-[#fff7da] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7a5a00]">
            Direct-Order Opportunity
          </span>
        ) : null}
      </div>

      <h3 className="font-[var(--font-display)] mt-3 text-2xl font-semibold leading-tight text-[#1f1f1f]">
        {restaurant.name}
      </h3>
      <DiscoveryRating
        rating={restaurant.rating}
        reviewCount={restaurant.user_rating_count}
      />
      <p className="mt-1 text-sm text-[#555]">{restaurant.address1}</p>
      <p className="text-sm text-[#555]">
        {restaurant.city}, {restaurant.state}
      </p>
      {restaurant.phone ? (
        <p className="mt-1 text-sm text-[#6f6357]">{restaurant.phone}</p>
      ) : null}

      <div className="mt-auto pt-4">
        {!isClaimed ? (
          <p className="mb-2 text-xs text-[#7a6d62]">
            See your recommended design, then verify ownership to launch.
          </p>
        ) : null}
        <Link
          href={ctaHref}
          data-analytics-event="discovery_result_click"
          data-analytics-payload={JSON.stringify({
            source: "city_results",
            result_type: "restaurant_listing",
            destination: isClaimed ? "listing" : "claim",
            state_slug: restaurant.state_slug,
            city_slug: restaurant.city_slug,
            restaurant_slug: restaurant.restaurant_slug,
            template_key: isClaimed ? null : "local-order",
          })}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#c73f2f] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#ad3324] active:scale-[0.99]"
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}

export function CityRestaurantExplorer({
  restaurants,
}: CityRestaurantExplorerProps) {
  const [query, setQuery] = useState("");
  const [unclaimedOnly, setUnclaimedOnly] = useState(false);
  const [directOrderOnly, setDirectOrderOnly] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedQueryDigits = query.replace(/\D/g, "");

  const filtered = useMemo(() => {
    return restaurants
      .filter((restaurant) => {
        const phoneDigits = (restaurant.phone || "").replace(/\D/g, "");
        const matchesQuery =
          !normalizedQuery ||
          restaurant.name.toLowerCase().includes(normalizedQuery) ||
          restaurant.address1.toLowerCase().includes(normalizedQuery) ||
          (normalizedQueryDigits.length >= 3 &&
            phoneDigits.includes(normalizedQueryDigits));
        if (!matchesQuery) return false;
        if (unclaimedOnly && restaurant.is_claimed) return false;
        if (directOrderOnly && restaurant.has_online_ordering) return false;
        return true;
      })
      .sort((a, b) => restaurantOpportunityScore(b) - restaurantOpportunityScore(a));
  }, [
    restaurants,
    normalizedQuery,
    normalizedQueryDigits,
    unclaimedOnly,
    directOrderOnly,
  ]);

  const topMatches = filtered.slice(0, 6);
  const moreMatches = filtered.slice(6);

  const totalUnclaimed = restaurants.filter((restaurant) => !restaurant.is_claimed).length;
  const totalDirectOrderOpportunity = restaurants.filter(
    (restaurant) => !restaurant.has_online_ordering
  ).length;
  const totalMissingWebsite = restaurants.filter(
    (restaurant) => !(restaurant.website_url && restaurant.website_url.trim().length > 0)
  ).length;

  useEffect(() => {
    if (filtered.length === 0) {
      trackEvent("discovery_empty_state_view", {
        surface: "city",
        reason: "no_matching_listings",
        query: normalizedQuery || null,
        unclaimed_only: unclaimedOnly,
        direct_order_only: directOrderOnly,
      });
      return;
    }

    trackEvent("discovery_results_view", {
      surface: "city",
      result_type: "restaurant_listing",
      visible_results: filtered.length,
      query: normalizedQuery || null,
      unclaimed_only: unclaimedOnly,
      direct_order_only: directOrderOnly,
    });
  }, [directOrderOnly, filtered.length, normalizedQuery, unclaimedOnly]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#decdbe] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b04a2d]">
              Best Matches First
            </p>
            <h2 className="font-[var(--font-display)] mt-1 text-3xl font-bold tracking-tight text-[#1f1f1f] md:text-4xl">
              Find your listing and claim it
            </h2>
            <p className="mt-2 text-sm text-[#5a534d]">
              Quick scan: name, address, status, and one next action.
            </p>
          </div>
          <Link
            href="/search"
            className="rounded-xl bg-[#c73f2f] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#ad3324] active:scale-[0.99]"
          >
            Find My Restaurant
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by restaurant name, street, or phone..."
            className="w-full rounded-xl border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#222] focus:border-[#cc3f2f] focus:outline-none focus:ring-2 focus:ring-[#f7d4cf]"
          />
          <button
            type="button"
            onClick={() => setUnclaimedOnly((value) => !value)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
              unclaimedOnly
                ? "border-[#cf4333] bg-[#fff4ef] text-[#ab3328]"
                : "border-[#d8cdbf] bg-white text-[#5f564d] hover:bg-[#fff7f1]"
            }`}
          >
            Unclaimed only
          </button>
          <button
            type="button"
            onClick={() => setDirectOrderOnly((value) => !value)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
              directOrderOnly
                ? "border-[#cf4333] bg-[#fff4ef] text-[#ab3328]"
                : "border-[#d8cdbf] bg-white text-[#5f564d] hover:bg-[#fff7f1]"
            }`}
          >
            Needs direct ordering
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-[#ebdece] bg-[#fff9f3] p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8d7a66]">Visible</p>
            <p className="mt-1 text-lg font-bold text-[#1f1f1f]">{filtered.length}</p>
          </div>
          <div className="rounded-xl border border-[#ebdece] bg-[#fff9f3] p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8d7a66]">Unclaimed</p>
            <p className="mt-1 text-lg font-bold text-[#1f1f1f]">{totalUnclaimed}</p>
          </div>
          <div className="rounded-xl border border-[#ebdece] bg-[#fff9f3] p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8d7a66]">No Direct Ordering</p>
            <p className="mt-1 text-lg font-bold text-[#1f1f1f]">{totalDirectOrderOpportunity}</p>
          </div>
          <div className="rounded-xl border border-[#ebdece] bg-[#fff9f3] p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8d7a66]">No Website</p>
            <p className="mt-1 text-lg font-bold text-[#1f1f1f]">{totalMissingWebsite}</p>
          </div>
        </div>
        <p aria-live="polite" className="sr-only">
          Showing {filtered.length} listings in this city view.
        </p>
      </section>

      {filtered.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#d8cdbf] bg-white p-8 text-center">
          <p className="text-sm text-[#665b52]">No listings match your current filters.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setUnclaimedOnly(false);
                setDirectOrderOnly(false);
              }}
              className="rounded-xl bg-[#c73f2f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ad3324]"
            >
              Clear Filters
            </button>
            <a
              href="tel:+18183420990"
              data-analytics-event="discovery_help_click"
              data-analytics-payload={JSON.stringify({
                source: "city_empty_state",
                channel: "phone",
              })}
              className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-2 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
            >
              Talk to a Human
            </a>
          </div>
        </section>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
                  Top Matches
                </p>
                <h3 className="font-[var(--font-display)] mt-1 text-2xl font-bold tracking-tight text-[#1f1f1f]">
                  Start with the best launch opportunities
                </h3>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topMatches.map((restaurant) => (
                <CityListingCard
                  key={`${restaurant.state_slug}/${restaurant.city_slug}/${restaurant.restaurant_slug}`}
                  restaurant={restaurant}
                />
              ))}
            </div>
          </section>

          {moreMatches.length > 0 ? (
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
                More Listings
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {moreMatches.map((restaurant) => (
                  <CityListingCard
                    key={`${restaurant.state_slug}/${restaurant.city_slug}/${restaurant.restaurant_slug}`}
                    restaurant={restaurant}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <section className="rounded-2xl border border-[#e8ddd2] bg-white p-5 shadow-sm md:flex md:items-center md:justify-between md:gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
            Need Help Finding It?
          </p>
          <h3 className="font-[var(--font-display)] mt-1 text-2xl font-bold tracking-tight text-[#1f1f1f]">
            We can guide you in under 15 minutes.
          </h3>
          <p className="mt-1 text-sm text-[#666]">
            English | Chinese support by call, text, or WhatsApp.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-0">
          <a
            href="tel:+18183420990"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "city_help_footer",
              channel: "phone",
            })}
            className="inline-flex rounded-lg border border-[#e2d4c4] bg-white px-4 py-2 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2]"
          >
            Call Support
          </a>
          <a
            href="https://wa.me/18183420990"
            target="_blank"
            rel="noreferrer"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "city_help_footer",
              channel: "whatsapp",
            })}
            className="inline-flex rounded-lg border border-[#e2d4c4] bg-white px-4 py-2 text-sm font-semibold text-[#6b5543] transition-colors hover:bg-[#fff8f2]"
          >
            WhatsApp Support
          </a>
        </div>
      </section>
    </div>
  );
}
