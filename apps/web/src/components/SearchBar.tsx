"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { trackEvent } from "@/lib/analytics";

export function SearchBar({ compact = false }: { compact?: boolean }) {
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

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isPending}
      className="w-full rounded-2xl border border-[#d9d9d9] bg-white p-1.5 shadow-sm transition-shadow duration-200 focus-within:shadow-md"
    >
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Restaurant, city, ZIP, address, or phone"
          className={`flex-1 rounded-xl border border-transparent text-[#1f1f1f] placeholder:text-[#787878] focus:border-[#d8d8d8] focus:outline-none ${
            compact ? "h-9 px-3 text-sm" : "h-12 px-4 text-base"
          }`}
        />
        <button
          type="submit"
          disabled={!query.trim() || isPending}
          className={`flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 ${
            compact
              ? "h-9 w-9 text-[#333] hover:bg-[#f6f6f6]"
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
