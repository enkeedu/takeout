"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { trackEvent } from "@/lib/analytics";

export function SearchBar({
  compact = false,
  variant = "default",
}: {
  compact?: boolean;
  variant?: "default" | "hero";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) return;

    trackEvent("discovery_search_submit_start", {
      query: nextQuery,
      source: compact ? "header_search" : "homepage_search",
    });

    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
    });
  };

  const isHero = variant === "hero" && !compact;

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isPending}
      className={`w-full transition-shadow duration-200 ${
        isHero
          ? "rounded-[28px] border border-[#ead6ca] bg-[#fff8f3] p-2.5 shadow-[0_18px_44px_rgba(25,12,6,0.18)] focus-within:shadow-[0_22px_52px_rgba(25,12,6,0.24)]"
          : "rounded-2xl border border-[#d9d9d9] bg-white p-1.5 shadow-sm focus-within:shadow-md"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Restaurant, city, ZIP, address, or phone"
          className={`flex-1 border border-transparent bg-white text-[#1f1f1f] placeholder:text-[#7d746d] focus:border-[#e1d4ca] focus:outline-none ${
            compact
              ? "h-9 rounded-xl px-3 text-sm"
              : isHero
              ? "h-14 rounded-[22px] px-5 text-base md:text-lg"
              : "h-12 rounded-xl px-4 text-base"
          }`}
        />
        <button
          type="submit"
          disabled={!query.trim() || isPending}
          className={`flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 ${
            compact
              ? "h-9 w-9 text-[#333] hover:bg-[#f6f6f6]"
              : isHero
              ? "h-14 rounded-[22px] bg-[#d88376] px-6 text-base text-white shadow-sm hover:bg-[#c87164]"
              : "h-12 bg-[#c73f2f] px-4 text-sm text-white shadow-sm hover:bg-[#ad3324]"
          }`}
          aria-label="Search restaurants"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
              {!compact ? "Searching..." : null}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M20 20L16.6 16.6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {!compact ? "Find My Restaurant" : null}
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
