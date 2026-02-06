import { Suspense } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStateName } from "@/lib/states";
import { SearchBar } from "@/components/SearchBar";
import type { StateInfo } from "@/lib/types";

export default async function HomePage() {
  const states = await apiFetch<StateInfo[]>("/browse/states");

  return (
    <div className="flex flex-col items-center gap-10 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Find Chinese Restaurants
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Browse Chinese restaurants across the United States
        </p>
      </div>

      <div className="w-full max-w-xl">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <div className="w-full">
        <h2 className="mb-4 text-2xl font-semibold text-gray-800">
          Browse by State
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {states.map((s) => (
            <Link
              key={s.state}
              href={`/${s.state.toLowerCase()}`}
              className="rounded-lg border border-gray-200 p-3 transition-colors hover:border-red-300 hover:bg-red-50"
            >
              <span className="font-medium text-gray-900">
                {getStateName(s.state)}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                ({s.restaurant_count})
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
