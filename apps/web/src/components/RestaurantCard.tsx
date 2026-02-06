import Link from "next/link";

interface RestaurantCardProps {
  name: string;
  address1: string;
  city: string;
  state: string;
  phone: string | null;
  state_slug: string;
  city_slug: string;
  restaurant_slug: string;
}

export function RestaurantCard({
  name,
  address1,
  city,
  state,
  phone,
  state_slug,
  city_slug,
  restaurant_slug,
}: RestaurantCardProps) {
  return (
    <Link
      href={`/${state_slug}/${city_slug}/${restaurant_slug}`}
      className="block rounded-lg border border-gray-200 p-4 transition-colors hover:border-red-300 hover:bg-red-50"
    >
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <p className="mt-1 text-sm text-gray-600">{address1}</p>
      <p className="text-sm text-gray-600">
        {city}, {state}
      </p>
      {phone && <p className="mt-2 text-sm text-red-600">{phone}</p>}
    </Link>
  );
}
