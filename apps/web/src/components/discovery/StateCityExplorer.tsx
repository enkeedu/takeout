"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CityInfo } from "@/lib/types";

type StateCityExplorerProps = {
  stateSlug: string;
  stateName: string;
  cities: CityInfo[];
  totalCities: number;
};

export function StateCityExplorer({
  stateSlug,
  stateName,
  cities,
  totalCities,
}: StateCityExplorerProps) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"alpha" | "count">("count");

  const visibleCities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? cities.filter((city) => city.city.toLowerCase().includes(normalizedQuery))
      : [...cities];

    if (sortBy === "count") {
      filtered.sort((a, b) => b.restaurant_count - a.restaurant_count);
    } else {
      filtered.sort((a, b) => a.city.localeCompare(b.city));
    }

    return filtered;
  }, [cities, query, sortBy]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-[#decab8] bg-gradient-to-br from-[#fff9f2] via-[#fffdfb] to-[#f8ede0] p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ffd6ba]/35 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-[#f8c3a8]/20 blur-3xl" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b04a2d]">
            Browse Cities
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-5xl font-black tracking-tight text-[#1f1f1f] md:text-6xl">
            {stateName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#5a534d] md:text-base">
            Pick a city to see local Chinese restaurant listings and quickly start
            your owner demo flow.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
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
                setSortBy(event.target.value as "alpha" | "count")
              }
              className="rounded-xl border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#222] focus:border-[#cc3f2f] focus:outline-none focus:ring-2 focus:ring-[#f7d4cf]"
            >
              <option value="count">Most Restaurants</option>
              <option value="alpha">A-Z</option>
            </select>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#eadccf] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8d7a66]">Visible</p>
              <p className="mt-1 text-xl font-bold text-[#1f1f1f]">
                {visibleCities.length}
              </p>
            </div>
            <div className="rounded-xl border border-[#eadccf] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8d7a66]">Total Cities</p>
              <p className="mt-1 text-xl font-bold text-[#1f1f1f]">{totalCities}</p>
            </div>
            <div className="rounded-xl border border-[#eadccf] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8d7a66]">Next Step</p>
              <p className="mt-1 text-base font-bold text-[#1f1f1f]">
                Open a city and start demo
              </p>
            </div>
          </div>
        </div>
      </section>

      {visibleCities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d8cdbf] bg-white p-8 text-center text-[#666]">
          No matching cities found.
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {visibleCities.map((city) => (
            <Link
              key={city.city_slug}
              href={`/${stateSlug}/${city.city_slug}`}
              className="group relative overflow-hidden rounded-2xl border border-[#e5d6c8] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#cc3f2f] hover:shadow-md"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#cf4333] via-[#e07653] to-[#f5ba76]" />
              <div className="flex items-start justify-between gap-2">
                <p className="text-2xl font-semibold text-[#202020]">{city.city}</p>
                <span className="rounded-full bg-[#fff3eb] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#ac4a2f]">
                  {city.restaurant_count >= 3 ? "Top Market" : "Growth Market"}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#666]">
                {city.restaurant_count} restaurant
                {city.restaurant_count !== 1 ? "s" : ""}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "Listing Imported",
                  "Template Ready",
                  "Owner Demo Flow",
                ].map((badge) => (
                  <span
                    key={`${city.city_slug}-${badge}`}
                    className="rounded-full border border-[#e8dacb] bg-[#fffdfa] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f6154]"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#c0392b]">
                Open city and start demo
                <span className="transition-transform group-hover:translate-x-0.5">
                  {"->"}
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[#e8ddd2] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
            Missing a city?
          </p>
          <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">
            We can import it quickly.
          </h2>
          <p className="mt-2 text-sm text-[#666]">
            If your city is not listed yet, we can import and normalize your
            restaurant data so you can start setup without waiting.
          </p>
          <Link
            href="/search"
            className="mt-4 inline-flex rounded-lg bg-[#c73f2f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ad3324]"
          >
            Add My City
          </Link>
        </div>

        <div className="rounded-2xl border border-[#e3d9ca] bg-[#fff9f3] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d6a3f]">
            Owner Tip
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[#5f5346]">
            <li>Start with your busiest city first.</li>
            <li>Launch direct ordering before expanding.</li>
            <li>Reuse the same setup playbook across locations.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}