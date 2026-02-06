import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStateName } from "@/lib/states";
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

  const data = await apiFetch<PaginatedResponse<CityInfo>>(
    `/browse/${state.toUpperCase()}/cities`
  );

  return (
    <div>
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-red-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{name}</span>
      </nav>

      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Chinese Restaurants in {name}
      </h1>

      {data.items.length === 0 ? (
        <p className="text-gray-500">No restaurants found in this state.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {data.items.map((city) => (
            <Link
              key={city.city_slug}
              href={`/${state}/${city.city_slug}`}
              className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-red-300 hover:bg-red-50"
            >
              <span className="font-medium text-gray-900">{city.city}</span>
              <span className="ml-2 text-sm text-gray-500">
                ({city.restaurant_count})
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
