import Link from "next/link";
import { buildClaimHref, buildListingHref } from "@/lib/claim";
import { DiscoveryRating } from "@/components/DiscoveryRating";

interface RestaurantCardProps {
  name: string;
  address1: string;
  city: string;
  state: string;
  phone: string | null;
  website_url?: string | null;
  has_online_ordering?: boolean;
  is_claimed?: boolean;
  rating?: number | null;
  user_rating_count?: number | null;
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
  website_url = null,
  has_online_ordering = false,
  is_claimed = false,
  rating = null,
  user_rating_count = null,
  state_slug,
  city_slug,
  restaurant_slug,
}: RestaurantCardProps) {
  const hasWebsite = Boolean(website_url && website_url.trim().length > 0);

  const claimHref = buildClaimHref({
    stateSlug: state_slug,
    citySlug: city_slug,
    restaurantSlug: restaurant_slug,
    templateKey: "local-order",
  });
  const listingHref = buildListingHref({
    stateSlug: state_slug,
    citySlug: city_slug,
    restaurantSlug: restaurant_slug,
  });

  const primaryLabel = is_claimed ? "View Listing" : "Preview Website";
  const primaryHref = is_claimed ? listingHref : claimHref;

  return (
    <article className="flex h-full flex-col rounded-[26px] border border-[#e8ddd2] bg-gradient-to-br from-white via-white to-[#fff8f3] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#d33f2f] hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            is_claimed ? "bg-[#f5f5f5] text-[#666]" : "bg-[#fff3df] text-[#8a5300]"
          }`}
        >
          {is_claimed ? "Claimed" : "Unclaimed"}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            hasWebsite ? "bg-[#eff8ff] text-[#20548c]" : "bg-[#fff1f0] text-[#b93d2f]"
          }`}
        >
          {hasWebsite ? "Website Found" : "No Website"}
        </span>
        {!has_online_ordering ? (
          <span className="rounded-full bg-[#fff7da] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7a5a00]">
            Website Opportunity
          </span>
        ) : null}
      </div>

      <h3 className="font-[var(--font-display)] mt-3 text-2xl font-semibold leading-tight text-[#1f1f1f]">
        {name}
      </h3>
      <DiscoveryRating rating={rating} reviewCount={user_rating_count} />
      <p className="mt-1 text-sm text-[#555]">{address1}</p>
      <p className="text-sm text-[#555]">
        {city}, {state}
      </p>
      {phone ? <p className="mt-1 text-sm text-[#6f6357]">{phone}</p> : null}

      <div className="mt-auto pt-4">
        {!is_claimed ? (
          <p className="mb-2 text-xs text-[#7a6d62]">
            Preview the website, then verify ownership to unlock updates.
          </p>
        ) : null}
        <Link
          href={primaryHref}
          data-analytics-event="discovery_result_click"
          data-analytics-payload={JSON.stringify({
            source: "search_results",
            result_type: "restaurant_listing",
            destination: is_claimed ? "listing" : "claim",
            state_slug,
            city_slug,
            restaurant_slug,
            template_key: is_claimed ? null : "local-order",
          })}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#c73f2f] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#ad3324] active:scale-[0.99]"
        >
          {primaryLabel}
        </Link>
      </div>
    </article>
  );
}
