import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStateName } from "@/lib/states";
import { RestaurantCard } from "@/components/RestaurantCard";
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
  const page = parseInt(sp.page || "1", 10);
  const stateName = getStateName(state);
  const cityName = formatCityName(city);

  const data = await apiFetch<PaginatedResponse<RestaurantListItem>>(
    `/browse/${state}/${city}/restaurants?page=${page}`
  );

  return (
    <div>
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-red-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/${state}`} className="hover:text-red-600">
          {stateName}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{cityName}</span>
      </nav>

      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Chinese Restaurants in {cityName}, {stateName}
      </h1>

      {data.items.length === 0 ? (
        <p className="text-gray-500">No restaurants found in this city.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.items.map((r) => (
              <RestaurantCard key={r.restaurant_slug} {...r} />
            ))}
          </div>
          <Pagination
            currentPage={data.page}
            totalPages={data.total_pages}
            basePath={`/${state}/${city}`}
          />
        </>
      )}
    </div>
  );
}
