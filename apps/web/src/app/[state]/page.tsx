import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStateName } from "@/lib/states";
import { getStateHeroTheme } from "@/lib/stateHero";
import { StateCityExplorer } from "@/components/discovery/StateCityExplorer";
import type { PaginatedResponse, CityInfo } from "@/lib/types";

type Props = { params: Promise<{ state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const name = getStateName(state);
  return {
    title: `Chinese Restaurants in ${name}`,
    description: `Browse Chinese restaurants in ${name}. Find takeout and delivery near you.`,
    alternates: { canonical: `https://chinese-takeout.com/${state}` },
  };
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const name = getStateName(state);
  const theme = getStateHeroTheme(state);

  const data = await apiFetch<PaginatedResponse<CityInfo>>(
    `/browse/${state.toUpperCase()}/cities?page=1&page_size=100`
  );

  return (
    <div className="space-y-8 pb-8">
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
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ffb999]">
            {theme.eyebrow}
          </p>
          <h1 className="[font-family:var(--font-display)] mt-2 text-5xl font-black tracking-tight text-white md:text-6xl">
            {name}
          </h1>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-[#ffd5bf]">
            {theme.headlineSuffix}
          </p>
          <p className="mt-3 max-w-3xl text-sm text-[#f2ddd1] md:text-base">
            {theme.supportingText}
          </p>
        </div>
      </section>

      {data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d8cdbf] bg-white p-8 text-center text-[#666]">
          No cities found in this state yet.
        </div>
      ) : (
        <StateCityExplorer
          stateSlug={state}
          stateName={name}
          cities={data.items}
          totalCities={data.total}
        />
      )}

      <section className="rounded-2xl border border-[#e5d4c3] bg-gradient-to-r from-[#fff3e5] to-[#ffefe2] p-6 shadow-sm md:flex md:items-center md:justify-between md:gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
            Owner Growth Move
          </p>
          <h2 className="[font-family:var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">
            Own a restaurant in {name}? Launch this week.
          </h2>
          <p className="mt-2 text-sm text-[#666]">
            Launch web ordering and AI phone support without rebuilding everything.
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
