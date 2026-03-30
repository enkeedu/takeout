import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from "@/lib/discoveryJsonLd";
import { getStateName } from "@/lib/states";
import { CORE_OWNER_PROMISE } from "@/lib/ownerJourney";
import { DiscoveryJsonLd } from "@/components/discovery/DiscoveryJsonLd";
import { DiscoveryProofStrip } from "@/components/discovery/DiscoveryProofStrip";
import { DiscoveryRouteEvent } from "@/components/discovery/DiscoveryRouteEvent";
import { CityRestaurantExplorer } from "@/components/discovery/CityRestaurantExplorer";
import { Pagination } from "@/components/Pagination";
import type { PaginatedResponse, RestaurantListItem } from "@/lib/types";

type Props = {
  params: Promise<{ state: string; city: string }>;
  searchParams: Promise<{ page?: string }>;
};

function formatCityName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params;
  const stateName = getStateName(state);
  const cityName = formatCityName(city);
  return {
    title: `Chinese Restaurants in ${cityName}, ${stateName} | Find Your Listing`,
    description: `Browse Chinese restaurants in ${cityName}, ${stateName}, find the right listing, and move into claim with owner-first support.`,
    alternates: {
      canonical: `https://chinese-takeout.com/${state}/${city}`,
    },
  };
}

export default async function CityPage({ params, searchParams }: Props) {
  const { state, city } = await params;
  const sp = await searchParams;
  const parsedPage = parseInt(sp.page || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const stateName = getStateName(state);
  const cityName = formatCityName(city);

  const data = await apiFetch<PaginatedResponse<RestaurantListItem>>(
    `/browse/${state}/${city}/restaurants?page=${page}`
  );
  const visibleCount = data.items.length;
  const totalOnline = data.items.filter((item) => item.has_online_ordering).length;
  const totalClaimed = data.items.filter((item) => item.is_claimed).length;
  const totalNoOnline = data.items.length - totalOnline;
  const totalUnclaimed = data.items.length - totalClaimed;
  const totalNoWebsite = data.items.filter(
    (item) => !(item.website_url && item.website_url.trim().length > 0)
  ).length;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: stateName, path: `/${state}` },
    { name: cityName, path: `/${state}/${city}` },
  ]);
  const collectionJsonLd = buildCollectionPageJsonLd({
    name: `Chinese restaurants in ${cityName}, ${stateName}`,
    description: `Owner-first directory for Chinese restaurants in ${cityName}, ${stateName}.`,
    path: page > 1 ? `/${state}/${city}?page=${page}` : `/${state}/${city}`,
  });
  const itemListJsonLd = buildItemListJsonLd({
    name: `Restaurant listings in ${cityName}, ${stateName}`,
    items: data.items.map((restaurant) => ({
      name: restaurant.name,
      path: `/${restaurant.state_slug}/${restaurant.city_slug}/${restaurant.restaurant_slug}`,
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
        <Link href={`/${state}`} className="hover:text-[#b73a2f]">
          {stateName}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{cityName}</span>
      </nav>

      <section className="full-bleed border-y border-[#2d2017]/45 bg-[#160f0c]">
        <div
          className="mx-auto w-full max-w-[1720px] bg-cover bg-center px-4 py-10 md:px-6 lg:px-8"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(15,11,9,0.9) 0%, rgba(19,13,10,0.82) 42%, rgba(15,11,9,0.9) 100%), url('/templates/ming/about-interior.webp')",
          }}
        >
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ffb999]">
                City Market Snapshot
              </p>
              <h1 className="font-[var(--font-display)] mt-2 text-5xl font-black tracking-tight text-white md:text-6xl">
                {cityName}, {stateName}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-[#f2ddd1] md:text-base">
                {CORE_OWNER_PROMISE} Compare local listings, spot who still needs direct
                ordering, and move into claim from the right restaurant page.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link
                  href="/search"
                  data-analytics-event="discovery_search_cta_click"
                  data-analytics-payload={JSON.stringify({
                    source: "city_hero_primary",
                    state_slug: state,
                    city_slug: city,
                  })}
                  className="inline-flex rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#ad3324] active:scale-[0.99]"
                >
                  Find My Restaurant
                </Link>
                <a
                  href="https://wa.me/18183420990"
                  target="_blank"
                  rel="noreferrer"
                  data-analytics-event="discovery_help_click"
                  data-analytics-payload={JSON.stringify({
                    source: "city_hero_help",
                    channel: "whatsapp",
                    state_slug: state,
                    city_slug: city,
                  })}
                  className="inline-flex rounded-xl border border-[#ffffff30] bg-white/10 px-4 py-3 text-sm font-semibold text-[#ffe1d3] transition-colors hover:bg-white/20"
                >
                  Talk to a Human
                </a>
              </div>
            </div>

            <aside className="rounded-2xl border border-[#ffffff24] bg-black/25 p-5 text-[#f4dacc]">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d5b9aa]">
                City Snapshot
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-xl border border-[#ffffff24] bg-black/25 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d5b9aa]">
                    Listings on this page
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">{visibleCount}</p>
                </div>
                <div className="rounded-xl border border-[#ffffff24] bg-black/25 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d5b9aa]">
                    Direct-order opportunity
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">{totalNoOnline}</p>
                </div>
                <div className="rounded-xl border border-[#ffffff24] bg-black/25 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d5b9aa]">
                    Unclaimed profiles
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">{totalUnclaimed}</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <DiscoveryProofStrip
        eyebrow="What Owners Need"
        items={[
          { label: "Pricing", value: "$299 setup + $99/mo" },
          { label: "Needs Website", value: `${totalNoWebsite} listings` },
          { label: "Direct-Order Opportunity", value: `${totalNoOnline} listings` },
          { label: "Launch Timeline", value: "Launch in 5-7 days" },
        ]}
      />

      {data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d8cdbf] bg-white p-8 text-center text-[#666]">
          No restaurants found in this city yet.
        </div>
      ) : (
        <>
          <DiscoveryRouteEvent
            eventName="discovery_results_view"
            payload={{
              surface: "city",
              state_slug: state,
              city_slug: city,
              result_type: "restaurant_listing",
              visible_results: data.items.length,
              page,
            }}
          />
          <CityRestaurantExplorer restaurants={data.items} />
          <Pagination
            currentPage={data.page}
            totalPages={data.total_pages}
            basePath={`/${state}/${city}`}
          />
        </>
      )}

      <section className="rounded-2xl border border-[#e5d4c3] bg-gradient-to-r from-[#fff3e5] to-[#ffefe2] p-6 shadow-sm md:flex md:items-center md:justify-between md:gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
            Need Help?
          </p>
          <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">
            Find the right listing and move into claim fast
          </h2>
          <p className="mt-2 text-sm text-[#666]">
            Search by restaurant name, ZIP, address, or phone, or talk to a human if
            the listing data needs help.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-0">
          <Link
            href="/search"
            data-analytics-event="discovery_search_cta_click"
            data-analytics-payload={JSON.stringify({
              source: "city_footer_cta",
              state_slug: state,
              city_slug: city,
            })}
            className="inline-flex rounded-xl border border-[#e0c9b7] bg-white px-4 py-3 text-sm font-semibold text-[#6e5a4c] transition-colors hover:bg-[#fff8f2]"
          >
            Find My Restaurant
          </Link>
          <a
            href="https://wa.me/18183420990"
            target="_blank"
            rel="noreferrer"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "city_footer_help",
              channel: "whatsapp",
              state_slug: state,
              city_slug: city,
            })}
            className="inline-flex rounded-xl border border-[#e0c9b7] bg-white px-4 py-3 text-sm font-semibold text-[#6e5a4c] transition-colors hover:bg-[#fff8f2]"
          >
            Talk to a Human
          </a>
        </div>
      </section>
    </div>
  );
}
