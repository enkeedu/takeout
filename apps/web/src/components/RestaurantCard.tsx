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
  const actionLabel = is_claimed ? "Open restaurant page" : "Claim listing";
  const badges: Array<{ label: string; className: string }> = [];

  if (is_claimed) {
    badges.push({
      label: "Claimed",
      className: "bg-[#fff2df] text-[#8a5300]",
    });
  } else {
    badges.push({
      label: "Unclaimed",
      className: "bg-[#f5f5f5] text-[#666]",
    });
  }

  if (has_online_ordering) {
    badges.push({
      label: "Online Ordering",
      className: "bg-[#fff3f1] text-[#c0392b]",
    });
  }

  if (has_ai_phone) {
    badges.push({
      label: "AI Phone",
      className: "bg-[#f2f6ff] text-[#2a5fb8]",
    });
  }

  return (
    <Link
      href={`/${state_slug}/${city_slug}/${restaurant_slug}`}
      className="group block rounded-2xl border border-[#e8ddd2] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#d33f2f] hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-2">
        {badges.map((badge) => (
          <span
            key={`${restaurant_slug}-${badge.label}`}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${badge.className}`}
          >
            {badge.label}
          </span>
        ))}
      </div>

      <h3 className="[font-family:var(--font-display)] mt-3 text-xl font-bold leading-tight text-[#1f1f1f] md:text-2xl">
        {name}
      </h3>
      <p className="mt-2 text-sm text-[#555]">{address1}</p>
      <p className="text-sm text-[#555]">
        {city}, {state}
      </p>
      {phone ? (
        <p className="mt-3 text-sm font-semibold text-[#c0392b]">{phone}</p>
      ) : (
        <p className="mt-3 text-sm text-[#888]">Phone not listed</p>
      )}

      <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[#8c7f73]">
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
