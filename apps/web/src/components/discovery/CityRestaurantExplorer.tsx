"use client";

import { useMemo, useState } from "react";
import { RestaurantCard } from "@/components/RestaurantCard";
import type { RestaurantListItem } from "@/lib/types";

type CityRestaurantExplorerProps = {
  restaurants: RestaurantListItem[];
};

export function CityRestaurantExplorer({
  restaurants,
}: CityRestaurantExplorerProps) {
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [aiPhoneOnly, setAiPhoneOnly] = useState(false);
  const [claimedOnly, setClaimedOnly] = useState(false);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      const matchesText =
        !normalizedQuery ||
        restaurant.name.toLowerCase().includes(normalizedQuery) ||
        restaurant.address1.toLowerCase().includes(normalizedQuery);

      if (!matchesText) return false;
      if (onlineOnly && !restaurant.has_online_ordering) return false;
      if (aiPhoneOnly && !restaurant.has_ai_phone) return false;
      if (claimedOnly && !restaurant.is_claimed) return false;
      return true;
    });
  }, [restaurants, query, onlineOnly, aiPhoneOnly, claimedOnly]);

  const totalWithOnline = restaurants.filter(
    (restaurant) => restaurant.has_online_ordering
  ).length;
  const totalWithAi = restaurants.filter((restaurant) => restaurant.has_ai_phone).length;
  const totalClaimed = restaurants.filter((restaurant) => restaurant.is_claimed).length;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[#decdbe] bg-gradient-to-br from-[#fff9f3] via-white to-[#f8eee3] p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
          Local Directory
        </p>
        <h2 className="[font-family:var(--font-display)] mt-2 text-3xl font-black tracking-tight text-[#1f1f1f] md:text-4xl">
          Find restaurants in this city
        </h2>
        <p className="mt-2 text-sm text-[#666]">
          Use simple filters to find the best listing to launch first.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by restaurant name or street..."
            className="w-full rounded-xl border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#222] focus:border-[#cc3f2f] focus:outline-none focus:ring-2 focus:ring-[#f7d4cf]"
          />
          <label className="inline-flex items-center gap-2 rounded-full border border-[#e5d4c3] bg-[#fff6ee] px-4 py-2 text-sm font-medium text-[#7a4d1e]">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(event) => setOnlineOnly(event.target.checked)}
              className="h-4 w-4 accent-[#c0392b]"
            />
            Has online ordering
          </label>
          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            className="rounded-full border border-[#d8cdbf] bg-white px-4 py-2 text-sm font-medium text-[#4f4f4f] hover:bg-[#fff7f1]"
          >
            {showAdvanced ? "Hide more filters" : "More filters"}
          </button>
        </div>

        {showAdvanced ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-[#e8ddd2] bg-white px-3 py-3 text-sm text-[#333]">
              <input
                type="checkbox"
                checked={aiPhoneOnly}
                onChange={(event) => setAiPhoneOnly(event.target.checked)}
                className="h-4 w-4 accent-[#c0392b]"
              />
              Has AI phone flow
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-[#e8ddd2] bg-white px-3 py-3 text-sm text-[#333]">
              <input
                type="checkbox"
                checked={claimedOnly}
                onChange={(event) => setClaimedOnly(event.target.checked)}
                className="h-4 w-4 accent-[#c0392b]"
              />
              Claimed profile only
            </label>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-[#ecdcc8] bg-[#fff7ee] px-4 py-3 text-sm text-[#7a4b0d]">
            <strong className="text-base text-[#4a2a00]">{filtered.length}</strong> visible
          </div>
          <div className="rounded-xl border border-[#f1d8d2] bg-[#fff3f1] px-4 py-3 text-sm text-[#8c2f24]">
            <strong className="text-base text-[#71281f]">{totalWithOnline}</strong> with online ordering
          </div>
          <div className="rounded-xl border border-[#d7dff0] bg-[#f2f6ff] px-4 py-3 text-sm text-[#2f4f87]">
            <strong className="text-base text-[#1d3f7a]">{totalWithAi}</strong> with AI phone
          </div>
          <div className="rounded-xl border border-[#e2e2e2] bg-[#f6f6f6] px-4 py-3 text-sm text-[#555]">
            <strong className="text-base text-[#2b2b2b]">{totalClaimed}</strong> claimed
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d8cdbf] bg-white p-8 text-center text-[#666]">
          No restaurants match your current filters.
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.restaurant_slug} {...restaurant} />
          ))}
        </section>
      )}
    </div>
  );
}
