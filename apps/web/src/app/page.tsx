import { Suspense } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStateName } from "@/lib/states";
import { SearchBar } from "@/components/SearchBar";
import type { StateInfo, CityInfo, PaginatedResponse } from "@/lib/types";

export default async function HomePage() {
  const states = await apiFetch<StateInfo[]>("/browse/states");
  const sortedStates = [...states].sort(
    (a, b) => b.restaurant_count - a.restaurant_count
  );
  const featuredStates = sortedStates.slice(0, 8);
  const totalRestaurants = states.reduce(
    (sum, item) => sum + item.restaurant_count,
    0
  );

  const topCitiesByState = new Map<string, CityInfo[]>();
  await Promise.all(
    featuredStates.map(async (state) => {
      try {
        const cityData = await apiFetch<PaginatedResponse<CityInfo>>(
          `/browse/${state.state}/cities?page=1&page_size=100`
        );
        topCitiesByState.set(
          state.state,
          [...cityData.items]
            .sort((a, b) => b.restaurant_count - a.restaurant_count)
            .slice(0, 3)
        );
      } catch {
        topCitiesByState.set(state.state, []);
      }
    })
  );

  const citiesCovered = featuredStates.reduce((sum, state) => {
    const topCities = topCitiesByState.get(state.state) || [];
    return sum + topCities.length;
  }, 0);

  return (
    <div className="space-y-10 pb-10">
      <section className="full-bleed relative overflow-hidden border-y border-[#2c1f18]/50 bg-[#130d0a] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{
            backgroundImage:
              "url('/templates/ming/hero.webp'), radial-gradient(circle at 25% 20%, rgba(255,140,102,0.45) 0, rgba(255,140,102,0) 48%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#120b09]/90 via-[#140d0a]/70 to-[#120b09]/85" />

        <div className="relative mx-auto w-full max-w-[1720px] px-4 py-12 md:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#ffb998]">
                Built for Chinese Restaurant Owners
              </p>
              <h1 className="font-[var(--font-display)] mt-3 max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Go from listing to live ordering website fast, without changing
                how your restaurant already works.
              </h1>
              <p className="mt-4 max-w-3xl text-base text-[#f5ddd2] md:text-lg">
                Keep your menu, keep your flow, and launch web + AI phone
                ordering in one place. Built for busy Chinese takeout owners.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/search"
                  className="rounded-xl bg-[#d64534] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#b43728]"
                >
                  Start My Demo Site
                </Link>
                <a
                  href="#states"
                  className="rounded-xl border border-[#f8c7ae]/55 bg-white/10 px-5 py-3 text-sm font-semibold text-[#ffe1d3] transition-colors hover:bg-white/20"
                >
                  Browse Listings
                </a>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#ffd7c3]">
                <span className="rounded-full border border-[#ffffff2a] bg-black/25 px-3 py-1">
                  No full rebuild
                </span>
                <span className="rounded-full border border-[#ffffff2a] bg-black/25 px-3 py-1">
                  Keep your existing POS
                </span>
                <span className="rounded-full border border-[#ffffff2a] bg-black/25 px-3 py-1">
                  Web + AI phone ordering
                </span>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#ffffff22] bg-black/25 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d9bdb0]">States</p>
                  <p className="mt-1 text-2xl font-bold">{states.length}</p>
                </div>
                <div className="rounded-xl border border-[#ffffff22] bg-black/25 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d9bdb0]">
                    Restaurants
                  </p>
                  <p className="mt-1 text-2xl font-bold">{totalRestaurants}</p>
                </div>
                <div className="rounded-xl border border-[#ffffff22] bg-black/25 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d9bdb0]">Coverage</p>
                  <p className="mt-1 text-2xl font-bold">{citiesCovered} cities</p>
                </div>
              </div>

              <div className="mt-7 w-full max-w-2xl rounded-2xl border border-[#ffffff2e] bg-black/25 p-3">
                <Suspense>
                  <SearchBar />
                </Suspense>
              </div>
            </div>

            <div
              id="owner-start"
              className="rounded-2xl border border-[#ffffff2a] bg-black/35 p-6 backdrop-blur-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#ffb998]">
                Owner Launch Plan
              </p>
              <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold leading-tight tracking-tight">
                Launch in 3 simple steps
              </h2>
              <ol className="mt-4 space-y-3 text-sm text-[#f1d7ca]">
                <li>
                  <span className="font-semibold text-white">1.</span> Find your
                  restaurant and confirm your listing details.
                </li>
                <li>
                  <span className="font-semibold text-white">2.</span> Pick a
                  Chinese-focused website style for your shop.
                </li>
                <li>
                  <span className="font-semibold text-white">3.</span> Enable web
                  ordering, AI phone flow, and launch with POS migration help.
                </li>
              </ol>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-[#ffffff26] bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-[#d9bdb0]">
                    Main win
                  </p>
                  <p className="mt-1 font-semibold text-white">More direct orders</p>
                </div>
                <div className="rounded-lg border border-[#ffffff26] bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-[#d9bdb0]">
                    Main risk reduced
                  </p>
                  <p className="mt-1 font-semibold text-white">No tech headache</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e2d4c5] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
            Owner ROI Snapshot
          </p>
          <h2 className="font-[var(--font-display)] mt-1 text-3xl font-bold tracking-tight text-[#1f1f1f] md:text-4xl">
            What changes when you launch direct ordering
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Keep more profit per order",
              desc: "Drive web orders to your own flow instead of relying only on app marketplaces.",
            },
            {
              title: "Launch faster with less stress",
              desc: "Start from existing listing data, then pick a template and go live.",
            },
            {
              title: "Add AI phone without replacing POS",
              desc: "Use the tools around your current setup instead of rebuilding operations.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#eadfd4] bg-[#fffaf5] p-5"
            >
              <p className="text-lg font-semibold text-[#222]">{item.title}</p>
              <p className="mt-2 text-sm text-[#666]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Directory Loaded",
            value: `${totalRestaurants}`,
            desc: "Real listings already in platform",
          },
          {
            label: "States Live",
            value: `${states.length}`,
            desc: "Owner traffic markets covered now",
          },
          {
            label: "Cities Covered",
            value: `${citiesCovered}`,
            desc: "Start where demand is already visible",
          },
          {
            label: "Owner Launch Path",
            value: "3 Steps",
            desc: "Listing -> Template -> Ordering live",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#e2d3c3] bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b4b1c]">
              {item.label}
            </p>
            <p className="mt-2 font-[var(--font-display)] text-4xl font-bold leading-none text-[#1f1f1f]">
              {item.value}
            </p>
            <p className="mt-2 text-sm text-[#666]">{item.desc}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-[#dbc8b6] bg-gradient-to-r from-[#fff8f1] via-[#f8eddf] to-[#fff2e6] p-6 shadow-sm md:p-8">
        <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b4b1c]">
              POS Migration Friendly
            </p>
            <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f] md:text-4xl">
              Keep your current POS. We handle the setup layer around it.
            </h2>
            <p className="mt-3 text-sm text-[#5f5b56] md:text-base">
              This is made for owners who are busy and not technical. You keep
              current operations while adding better web ordering and AI phone flow.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Menu import support",
                "No retyping everything",
                "Owner-first onboarding",
                "AI call-in ordering",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#d9c4b1] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#705947]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e2d3c3] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
              Owner Checklist
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[#4f4b46]">
              <li>Claim listing and verify phone/address</li>
              <li>Pick template and domain name</li>
              <li>Enable direct ordering + AI phone workflow</li>
              <li>Go live and track direct-order growth</li>
            </ul>
            <Link
              href="/search"
              className="mt-4 inline-flex rounded-xl bg-[#c73f2f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ad3324]"
            >
              Start My Demo Site
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e3d5c4] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
              Why Owners Switch
            </p>
            <h2 className="font-[var(--font-display)] mt-1 text-3xl font-bold tracking-tight text-[#1f1f1f] md:text-4xl">
              Built for non-technical restaurant teams
            </h2>
          </div>
          <span className="rounded-full border border-[#eadfd4] bg-[#fff8f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#7c6a58]">
            Operator-first workflow
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Use your real listing data",
              desc: "No blank setup page. Start from information already visible in your market.",
            },
            {
              title: "Chinese-focused website templates",
              desc: "Preview designs made for takeout menus and direct online ordering flows.",
            },
            {
              title: "Ordering + phone flow in one stack",
              desc: "Web ordering, call support, and owner controls in one system.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[#e9ddd0] bg-[#fffdfa] p-5"
            >
              <h3 className="text-lg font-semibold text-[#222]">{item.title}</h3>
              <p className="mt-2 text-sm text-[#666]">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="states">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b73a2f]">
              Browse by State
            </p>
            <h2 className="font-[var(--font-display)] mt-1 text-4xl font-bold tracking-tight text-[#1f1f1f]">
              Pick a state and start from real listings
            </h2>
          </div>
          <p className="text-sm text-[#666]">Top {featuredStates.length} markets</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {featuredStates.map((state) => {
            const topCities = topCitiesByState.get(state.state) || [];
            return (
              <Link
                key={state.state}
                href={`/${state.state.toLowerCase()}`}
                className="group rounded-2xl border border-[#e8ddd2] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#cf4333] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-[#1f1f1f]">
                      {getStateName(state.state)}
                    </h3>
                    <p className="mt-1 text-sm text-[#666]">
                      {state.restaurant_count} restaurant
                      {state.restaurant_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#fff2ef] px-3 py-1 text-xs font-semibold text-[#b73a2f]">
                    Open
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {topCities.length ? (
                    topCities.map((city) => (
                      <span
                        key={`${state.state}-${city.city_slug}`}
                        className="rounded-full border border-[#eadfd4] bg-[#fffdf8] px-3 py-1 text-xs text-[#575757]"
                      >
                        {city.city} ({city.restaurant_count})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#777]">Top cities unavailable</span>
                  )}
                </div>

                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#c0392b]">
                  Open state and pick a city
                  <span className="transition-transform group-hover:translate-x-0.5">
                    {"->"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-[#f0d3c7] bg-gradient-to-r from-[#fff4ea] to-[#ffece7] p-6 md:flex md:items-center md:justify-between md:gap-6 md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
            Owner Call To Action
          </p>
          <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f] md:text-4xl">
            Want your demo website this week?
          </h2>
          <p className="mt-2 text-sm text-[#666] md:text-base">
            Start from your real restaurant listing and launch faster.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/search"
            className="inline-flex rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ad3324]"
          >
            Start My Demo Site
          </Link>
        </div>
      </section>
    </div>
  );
}