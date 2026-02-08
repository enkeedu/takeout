import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStateName } from "@/lib/states";
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
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params;
  const stateName = getStateName(state);
  const cityName = formatCityName(city);
  return {
    title: `Chinese Restaurants in ${cityName}, ${stateName}`,
    description: `Find Chinese takeout restaurants in ${cityName}, ${stateName}.`,
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
  const totalOnline = data.items.filter((item) => item.has_online_ordering).length;
  const totalClaimed = data.items.filter((item) => item.is_claimed).length;

  return (
    <div className="space-y-8 pb-8">
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
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ffb999]">
            City Market Snapshot
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-5xl font-black tracking-tight text-white md:text-6xl">
            {cityName}, {stateName}
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-[#f2ddd1] md:text-base">
            Compare local restaurants, identify who supports direct ordering, and
            pick where to launch first.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#ffffff24] bg-black/25 px-4 py-3 text-[#f4dacc]">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d5b9aa]">Total</p>
              <p className="mt-1 text-xl font-bold text-white">{data.total}</p>
            </div>
            <div className="rounded-xl border border-[#ffffff24] bg-black/25 px-4 py-3 text-[#f4dacc]">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d5b9aa]">Online Ordering</p>
              <p className="mt-1 text-xl font-bold text-white">{totalOnline}</p>
            </div>
            <div className="rounded-xl border border-[#ffffff24] bg-black/25 px-4 py-3 text-[#f4dacc]">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d5b9aa]">Claimed</p>
              <p className="mt-1 text-xl font-bold text-white">{totalClaimed}</p>
            </div>
          </div>
        </div>
      </section>

      {data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d8cdbf] bg-white p-8 text-center text-[#666]">
          No restaurants found in this city yet.
        </div>
      ) : (
        <>
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
            Owner Growth Move
          </p>
          <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">
            Turn this city page into real order volume
          </h2>
          <p className="mt-2 text-sm text-[#666]">
            Use your listing to launch a conversion-focused website and direct
            ordering flow for your customers.
          </p>
        </div>
        <Link
          href="/search"
          className="mt-4 inline-flex rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ad3324] md:mt-0"
        >
          Start My Demo Site
        </Link>
      </section>
    </div>
  );
}
