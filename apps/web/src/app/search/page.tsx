import { Suspense } from "react";
import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { SearchBar } from "@/components/SearchBar";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Pagination } from "@/components/Pagination";
import type { PaginatedResponse, SearchResultItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search Results",
  robots: { index: false },
};

async function SearchResults({ q, page }: { q: string; page: number }) {
  if (!q.trim()) {
    return (
      <p className="text-center text-gray-500">
        Enter a search term to find restaurants.
      </p>
    );
  }

  const data = await apiFetch<PaginatedResponse<SearchResultItem>>(
    `/search?q=${encodeURIComponent(q)}&page=${page}`
  );

  if (data.items.length === 0) {
    return (
      <p className="text-center text-gray-500">
        No restaurants found for &ldquo;{q}&rdquo;.
      </p>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-gray-600">
        {data.total} result{data.total !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.items.map((r) => (
          <RestaurantCard
            key={`${r.state_slug}/${r.city_slug}/${r.restaurant_slug}`}
            {...r}
          />
        ))}
      </div>
      <Pagination
        currentPage={data.page}
        totalPages={data.total_pages}
        basePath="/search"
        queryParams={{ q }}
      />
    </>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const page = parseInt(params.page || "1", 10);

  return (
    <div>
      <div className="mb-6 max-w-xl">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>
      <SearchResults q={q} page={page} />
    </div>
  );
}
