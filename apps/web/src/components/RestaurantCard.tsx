import Link from "next/link";

interface RestaurantCardProps {
  name: string;
  address1: string;
  city: string;
  state: string;
  phone: string | null;
  has_online_ordering?: boolean;
  has_ai_phone?: boolean;
  is_claimed?: boolean;
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
  has_online_ordering = false,
  has_ai_phone = false,
  is_claimed = false,
  state_slug,
  city_slug,
  restaurant_slug,
}: RestaurantCardProps) {
  const actionLabel = is_claimed
    ? "Open restaurant preview"
    : "Claim listing and start demo";

  return (
    <Link
      href={`/${state_slug}/${city_slug}/${restaurant_slug}`}
      className="group block rounded-2xl border border-[#e8ddd2] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#d33f2f] hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-2">
        {is_claimed ? (
          <span className="rounded-full bg-[#fff2df] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a5300]">
            Claimed
          </span>
        ) : (
          <span className="rounded-full bg-[#f5f5f5] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#666]">
            Unclaimed
          </span>
        )}
        {has_online_ordering ? (
          <span className="rounded-full bg-[#fff3f1] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#c0392b]">
            Online Ordering
          </span>
        ) : null}
        {has_ai_phone ? (
          <span className="rounded-full bg-[#f2f6ff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#2a5fb8]">
            AI Phone
          </span>
        ) : null}
        <span className="rounded-full bg-[#f4fff5] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#23613d]">
          Template Ready
        </span>
      </div>

      <h3 className="font-[var(--font-display)] mt-3 text-2xl font-semibold leading-tight text-[#1f1f1f]">
        {name}
      </h3>
      <p className="mt-1 text-sm text-[#555]">{address1}</p>
      <p className="text-sm text-[#555]">
        {city}, {state}
      </p>
      {phone ? (
        <p className="mt-3 text-sm font-medium text-[#c0392b]">{phone}</p>
      ) : (
        <p className="mt-3 text-sm text-[#888]">Phone not listed</p>
      )}

      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[#8c7f73]">
        Owner next step
      </p>
      <div className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#c0392b]">
        {actionLabel}
        <span className="transition-transform group-hover:translate-x-0.5">
          {"->"}
        </span>
      </div>
    </Link>
  );
}
