import type { Metadata } from "next";
import Link from "next/link";
import { ApiError, apiFetch } from "@/lib/api";
import type { MenuOut, RestaurantDetail } from "@/lib/types";
import { CORE_OWNER_PROMISE } from "@/lib/ownerJourney";
import { ClaimWizardClient } from "./ClaimWizardClient";

export const metadata: Metadata = {
  title: "Claim and Manage Your Website",
  robots: { index: false },
};

type ClaimTemplateKey = "local-order" | "local-storefront" | "local-express";
type ClaimTemplateSource = "query" | "legacy" | "default";

const CLAIM_TEMPLATE_OPTIONS: ClaimTemplateKey[] = [
  "local-order",
  "local-storefront",
  "local-express",
];

type ClaimParams = {
  state?: string;
  city?: string;
  slug?: string;
  template?: string;
};

type RestaurantFetchResult =
  | { status: "ok"; restaurant: RestaurantDetail }
  | { status: "not_found" }
  | { status: "error" };

async function getRestaurant(
  state: string,
  city: string,
  slug: string
): Promise<RestaurantFetchResult> {
  try {
    const restaurant = await apiFetch<RestaurantDetail>(`/restaurants/${state}/${city}/${slug}`);
    return { status: "ok", restaurant };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { status: "not_found" };
    }
    return { status: "error" };
  }
}

async function getMenu(
  state: string,
  city: string,
  slug: string
): Promise<MenuOut | null> {
  try {
    return await apiFetch<MenuOut>(`/menus/${state}/${city}/${slug}`);
  } catch {
    return null;
  }
}

function normalizeQueryPart(value?: string): string {
  return (value || "").trim().toLowerCase();
}

function isClaimTemplateKey(value: string): value is ClaimTemplateKey {
  return CLAIM_TEMPLATE_OPTIONS.includes(value as ClaimTemplateKey);
}

function getTemplateFromQuery(raw?: string): ClaimTemplateKey {
  const normalized = (raw || "").trim().toLowerCase();
  if (isClaimTemplateKey(normalized)) return normalized;
  return "local-order";
}

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<ClaimParams>;
}) {
  const params = await searchParams;
  const state = normalizeQueryPart(params.state);
  const city = normalizeQueryPart(params.city);
  const slug = normalizeQueryPart(params.slug);
  const template = getTemplateFromQuery(params.template);
  const normalizedTemplateParam = (params.template || "").trim().toLowerCase();
  const templateSource: ClaimTemplateSource = isClaimTemplateKey(normalizedTemplateParam)
    ? "query"
    : normalizedTemplateParam
    ? "legacy"
    : "default";
  const retryHref = `/claim?state=${encodeURIComponent(state)}&city=${encodeURIComponent(
    city
  )}&slug=${encodeURIComponent(slug)}&template=${encodeURIComponent(template)}`;

  if (!state || !city || !slug) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
            Claim Your Website
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
            Missing listing context
          </h1>
          <p className="mt-2 text-sm text-[#665b52]">
            {CORE_OWNER_PROMISE} Start by finding your listing first.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/search?claim=1"
              className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324]"
            >
              Find My Restaurant
            </Link>
            <a
              href="tel:+18183420990"
              className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
            >
              Call Support
            </a>
            <a
              href="https://wa.me/18183420990"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
            >
              WhatsApp Support
            </a>
          </div>
        </section>
      </div>
    );
  }

  const [restaurantResult, menu] = await Promise.all([
    getRestaurant(state, city, slug),
    getMenu(state, city, slug),
  ]);

  if (restaurantResult.status === "not_found") {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
            Claim Your Website
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
            Listing not found
          </h1>
          <p className="mt-2 text-sm text-[#665b52]">
            We could not load this restaurant profile. Search again and pick the listing.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/search?claim=1"
              className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324]"
            >
              Find My Restaurant
            </Link>
            <a
              href="https://wa.me/18183420990"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
            >
              WhatsApp Support
            </a>
          </div>
        </section>
      </div>
    );
  }

  if (restaurantResult.status === "error") {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
            Claim Your Website
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
            Temporary loading issue
          </h1>
          <p className="mt-2 text-sm text-[#665b52]">
            We could not load this listing right now. Retry, or contact support to continue your
            website claim.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={retryHref}
              className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324]"
            >
              Retry Claim
            </Link>
            <a
              href="tel:+18183420990"
              className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
            >
              Call Support
            </a>
            <a
              href="https://wa.me/18183420990"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
            >
              WhatsApp Support
            </a>
          </div>
        </section>
      </div>
    );
  }

  const restaurant = restaurantResult.restaurant;
  const menuCategoryCount = menu?.categories.length || 0;
  const menuItemCount =
    menu?.categories.reduce((sum, category) => sum + category.items.length, 0) || 0;
  const hasHours =
    Boolean(restaurant.hours_json) &&
    typeof restaurant.hours_json === "object" &&
    Object.keys(restaurant.hours_json || {}).length > 0;

  return (
    <ClaimWizardClient
      stateSlug={restaurant.state_slug}
      citySlug={restaurant.city_slug}
      restaurantSlug={restaurant.restaurant_slug}
      restaurantName={restaurant.name}
      addressLine={`${restaurant.address1}, ${restaurant.city}, ${restaurant.state}`}
      phone={restaurant.phone}
      templateKey={template}
      templateSource={templateSource}
      menuCategoryCount={menuCategoryCount}
      menuItemCount={menuItemCount}
      hasHours={hasHours}
    />
  );
}
