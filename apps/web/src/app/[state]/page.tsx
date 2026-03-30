import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from "@/lib/discoveryJsonLd";
import { getStateName } from "@/lib/states";
import { getStateHeroTheme } from "@/lib/stateHero";
import { CORE_OWNER_PROMISE } from "@/lib/ownerJourney";
import { DiscoveryJsonLd } from "@/components/discovery/DiscoveryJsonLd";
import { DiscoveryProofStrip } from "@/components/discovery/DiscoveryProofStrip";
import { DiscoveryRouteEvent } from "@/components/discovery/DiscoveryRouteEvent";
import { StateCityExplorer } from "@/components/discovery/StateCityExplorer";
import type { PaginatedResponse, CityInfo } from "@/lib/types";

type Props = { params: Promise<{ state: string }> };

async function getAllCitiesForState(
  state: string
): Promise<PaginatedResponse<CityInfo>> {
  const pageSize = 100;
  const firstPage = await apiFetch<PaginatedResponse<CityInfo>>(
    `/browse/${state.toUpperCase()}/cities?page=1&page_size=${pageSize}`
  );

  if (firstPage.total_pages <= 1) {
    return firstPage;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.total_pages - 1 }, (_, index) =>
      apiFetch<PaginatedResponse<CityInfo>>(
        `/browse/${state.toUpperCase()}/cities?page=${index + 2}&page_size=${pageSize}`
      )
    )
  );

  const dedupedBySlug = new Map<string, CityInfo>();
  for (const city of [...firstPage.items, ...remainingPages.flatMap((page) => page.items)]) {
    dedupedBySlug.set(city.city_slug, city);
  }

  const mergedItems = Array.from(dedupedBySlug.values());
  return {
    ...firstPage,
    items: mergedItems,
    page: 1,
    page_size: mergedItems.length,
    total_pages: 1,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const name = getStateName(state);
  return {
    title: `Chinese Restaurants in ${name} | Find Your Listing`,
    description: `Browse Chinese restaurants in ${name}, find the right listing, and launch direct ordering with owner-first support.`,
    alternates: { canonical: `https://chinese-takeout.com/${state}` },
  };
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const name = getStateName(state);
  const theme = getStateHeroTheme(state);

  const data = await getAllCitiesForState(state);
  const totalNoOnline = data.items.reduce(
    (sum, city) => sum + city.no_online_ordering_count,
    0
  );
  const totalUnclaimed = data.items.reduce((sum, city) => sum + city.unclaimed_count, 0);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name, path: `/${state}` },
  ]);
  const collectionJsonLd = buildCollectionPageJsonLd({
    name: `Chinese restaurants in ${name}`,
    description: `Owner-first directory for Chinese restaurants in ${name}.`,
    path: `/${state}`,
  });
  const itemListJsonLd = buildItemListJsonLd({
    name: `City listings in ${name}`,
    items: data.items.map((city) => ({
      name: city.city,
      path: `/${state}/${city.city_slug}`,
    })),
  });

  return (
    <div className="space-y-8 pb-8">
      <DiscoveryJsonLd data={breadcrumbJsonLd} />
      <DiscoveryJsonLd data={collectionJsonLd} />
      <DiscoveryJsonLd data={itemListJsonLd} />

      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:text-[#b73a2f]">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{name}</span>
      </nav>

      <section className="full-bleed border-y border-[#2d2017]/45 bg-[#150f0b]">
        <div
          className="mx-auto w-full max-w-[1720px] bg-cover bg-center px-4 py-10 md:px-6 lg:px-8"
          style={{
            backgroundImage:
              `linear-gradient(90deg, rgba(15,11,9,0.92) 0%, rgba(18,13,10,0.82) 40%, rgba(15,11,9,0.9) 100%), url('${theme.imagePath}')`,
          }}
        >
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ffb999]">
                {theme.eyebrow}
              </p>
              <h1 className="font-[var(--font-display)] mt-2 text-5xl font-black tracking-tight text-white md:text-6xl">
                {name}
              </h1>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-[#ffd5bf]">
                {theme.headlineSuffix}
              </p>
              <p className="mt-3 max-w-3xl text-sm text-[#f2ddd1] md:text-base">
                {CORE_OWNER_PROMISE} {theme.supportingText}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link
                  href="/search"
                  data-analytics-event="discovery_search_cta_click"
                  data-analytics-payload={JSON.stringify({
                    source: "state_hero_primary",
                    state_slug: state,
                  })}
                  className="inline-flex rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#ad3324] active:scale-[0.99]"
                >
                  Find My Restaurant
                </Link>
                <a
                  href="tel:+18183420990"
                  data-analytics-event="discovery_help_click"
                  data-analytics-payload={JSON.stringify({
                    source: "state_hero_help",
                    channel: "phone",
                    state_slug: state,
                  })}
                  className="inline-flex rounded-xl border border-[#ffffff30] bg-white/10 px-4 py-3 text-sm font-semibold text-[#ffe1d3] transition-colors hover:bg-white/20"
                >
                  Talk to a Human
                </a>
              </div>
            </div>

            <aside className="rounded-2xl border border-[#ffffff24] bg-black/25 p-5 text-[#f4dacc]">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d5b9aa]">
                State Snapshot
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-xl border border-[#ffffff24] bg-black/25 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d5b9aa]">Cities</p>
                  <p className="mt-1 text-xl font-bold text-white">{data.total}</p>
                </div>
                <div className="rounded-xl border border-[#ffffff24] bg-black/25 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d5b9aa]">
                    Direct-order opportunity
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">{totalNoOnline}</p>
                </div>
                <div className="rounded-xl border border-[#ffffff24] bg-black/25 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d5b9aa]">
                    Unclaimed listings
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">{totalUnclaimed}</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <DiscoveryProofStrip
        eyebrow="What Owners Get"
        items={[
          { label: "Transparent Pricing", value: "$299 setup + $99/mo" },
          { label: "Launch Timeline", value: "Go live in 5-7 days" },
          { label: "Bilingual Help", value: "English | Chinese support" },
          { label: "Human Support", value: "Call, text, or WhatsApp" },
        ]}
      />

      {data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d8cdbf] bg-white p-8 text-center text-[#666]">
          No cities found in this state yet.
        </div>
      ) : (
        <>
          <DiscoveryRouteEvent
            eventName="discovery_results_view"
            payload={{
              surface: "state",
              state_slug: state,
              result_type: "city",
              visible_results: data.items.length,
            }}
          />
          <StateCityExplorer
            stateSlug={state}
            stateName={name}
            cities={data.items}
            totalCities={data.total}
          />
        </>
      )}

      <section className="rounded-2xl border border-[#e5d4c3] bg-gradient-to-r from-[#fff3e5] to-[#ffefe2] p-6 shadow-sm md:flex md:items-center md:justify-between md:gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
            Owner Growth Move
          </p>
          <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">
            Own a restaurant in {name}? Start with the right listing.
          </h2>
          <p className="mt-2 text-sm text-[#666]">
            Search by name, ZIP, address, or phone if you want the fastest path into
            claim and launch.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-0">
          <Link
            href="/search"
            data-analytics-event="discovery_search_cta_click"
            data-analytics-payload={JSON.stringify({
              source: "state_bottom_cta",
              state_slug: state,
            })}
            className="inline-flex rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#ad3324] active:scale-[0.99]"
          >
            Find My Restaurant
          </Link>
          <a
            href="tel:+18183420990"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "state_bottom_help",
              channel: "phone",
              state_slug: state,
            })}
            className="inline-flex rounded-xl border border-[#e0c9b7] bg-white px-4 py-3 text-sm font-semibold text-[#6e5a4c] transition-colors hover:bg-[#fff8f2]"
          >
            Book a 15-min Setup Call
          </a>
        </div>
      </section>
    </div>
  );
}
