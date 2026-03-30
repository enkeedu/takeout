import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type {
  MenuOut,
  RestaurantDetail,
  RestaurantReviewsResponse,
} from "@/lib/types";
import { menuFromApi } from "@/lib/menu";
import {
  type Review,
  buildHighlights,
  buildHours,
  buildMockGallery,
  buildMockMenu,
  buildMockReviews,
  buildMockSpecials,
  buildTagline,
} from "@/lib/restaurantDemo";
import { TemplateMing } from "@/components/restaurant-templates/TemplateMing";
import { TemplateMingSlim } from "@/components/restaurant-templates/TemplateMingSlim";
import { TemplateMingBalanced } from "@/components/restaurant-templates/TemplateMingBalanced";
import { TemplateMingFull } from "@/components/restaurant-templates/TemplateMingFull";
import { TemplateLocalOrder } from "@/components/restaurant-templates/TemplateLocalOrder";
import { TemplateLocalStorefront } from "@/components/restaurant-templates/TemplateLocalStorefront";
import { TemplateLocalExpress } from "@/components/restaurant-templates/TemplateLocalExpress";
import { TemplateLocalFeast } from "@/components/restaurant-templates/TemplateLocalFeast";
import { TemplateNightMarket } from "@/components/restaurant-templates/TemplateNightMarket";
import { TemplateWokFire } from "@/components/restaurant-templates/TemplateWokFire";
import { TemplateMetroGrid } from "@/components/restaurant-templates/TemplateMetroGrid";
import { TemplateEditorialColumn } from "@/components/restaurant-templates/TemplateEditorialColumn";
import { TemplateGlassOrbit } from "@/components/restaurant-templates/TemplateGlassOrbit";
import {
  DEFAULT_TEMPLATE_KEY,
  isDeployableTemplateKey,
  isBuyerTemplateKey,
  isTemplateKey,
  type TemplateKey,
} from "@/components/restaurant-templates/types";
import { TemplatePreviewToggle } from "@/components/TemplatePreviewToggle";
import { ListingOpenTracker } from "@/components/ListingOpenTracker";
import {
  resolveFontPreset,
  resolvePalette,
} from "@/components/restaurant-templates/preview-options";
import { buildClaimHref } from "@/lib/claim";
import { CORE_OWNER_PROMISE } from "@/lib/ownerJourney";

type Props = {
  params: Promise<{ state: string; city: string; slug: string }>;
  searchParams: Promise<{
    template?: string;
    preview?: string;
    claimPreview?: string;
    font?: string;
    palette?: string;
  }>;
};

const MOCK_MENU_TEMPLATE_KEYS: TemplateKey[] = [
  "metro-grid",
  "editorial-column",
  "glass-orbit",
];

async function getRestaurant(
  state: string,
  city: string,
  slug: string
): Promise<RestaurantDetail | null> {
  try {
    return await apiFetch<RestaurantDetail>(
      `/restaurants/${state}/${city}/${slug}`
    );
  } catch {
    return null;
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

async function getRestaurantReviews(
  state: string,
  city: string,
  slug: string
): Promise<RestaurantReviewsResponse | null> {
  try {
    return await apiFetch<RestaurantReviewsResponse>(
      `/restaurants/${state}/${city}/${slug}/reviews`
    );
  } catch {
    return null;
  }
}

function selectTemplateKey(
  restaurant: RestaurantDetail,
  requested: string | undefined
): TemplateKey {
  if (requested && isTemplateKey(requested)) {
    return requested;
  }
  if (restaurant.template_key && isDeployableTemplateKey(restaurant.template_key)) {
    return restaurant.template_key;
  }
  return DEFAULT_TEMPLATE_KEY;
}

function buildMapsUrl(restaurant: RestaurantDetail): string {
  const query = encodeURIComponent(`${restaurant.name}, ${restaurant.address1}, ${restaurant.city}, ${restaurant.state} ${restaurant.zip}`);
  if (restaurant.google_place_id) {
    return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${restaurant.google_place_id}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city, slug } = await params;
  const r = await getRestaurant(state, city, slug);
  if (!r) return { title: "Restaurant Not Found" };

  return {
    title: `${r.name} - ${r.city}, ${r.state}`,
    description: `${r.name} at ${r.address1}, ${r.city}, ${r.state} ${r.zip}. ${r.phone ? `Phone: ${r.phone}.` : ""} Chinese restaurant.`,
    alternates: {
      canonical: `https://chinese-takeout.com/${r.state_slug}/${r.city_slug}/${r.restaurant_slug}`,
    },
  };
}

export default async function RestaurantPage({ params, searchParams }: Props) {
  const { state, city, slug } = await params;
  const sp = await searchParams;
  const [r, menuData, reviewData] = await Promise.all([
    getRestaurant(state, city, slug),
    getMenu(state, city, slug),
    getRestaurantReviews(state, city, slug),
  ]);
  if (!r) notFound();

  const templateKey = selectTemplateKey(r, sp.template);
  const fontPreset = resolveFontPreset(sp.font);
  const palette = resolvePalette(sp.palette);
  const templateUsesMockMenu = MOCK_MENU_TEMPLATE_KEYS.includes(templateKey);
  const menu = templateUsesMockMenu
    ? buildMockMenu(r.name)
    : menuData
      ? menuFromApi(menuData)
      : buildMockMenu(r.name);
  const orderingEnabled = Boolean(menuData) && !templateUsesMockMenu;
  const reviews: Review[] =
    reviewData?.items && reviewData.items.length > 0
      ? reviewData.items.slice(0, 3).map((item) => ({
          id: item.id,
          name: item.name,
          rating: item.rating,
          quote: item.quote,
          source: item.source || "Google",
        }))
      : buildMockReviews(r.name, r.city);
  const gallery = buildMockGallery(r.name);
  const specials = buildMockSpecials(r.name);
  const highlights = buildHighlights(r.name, r.city);
  const hours = buildHours(r.hours_json);
  const tagline = buildTagline(r.name, r.city);
  const mapsUrl = buildMapsUrl(r);
  const basePath = `/${r.state_slug}/${r.city_slug}/${r.restaurant_slug}`;
  const orderPath = basePath;
  const previewMode = sp.preview === "1";
  const claimPreviewMode = sp.claimPreview === "1";
  const canSaveDefaultTemplate = Boolean(process.env.ADMIN_TOKEN);
  const claimTemplateKey = isBuyerTemplateKey(templateKey)
    ? templateKey
    : DEFAULT_TEMPLATE_KEY;
  const claimHref = buildClaimHref({
    stateSlug: r.state_slug,
    citySlug: r.city_slug,
    restaurantSlug: r.restaurant_slug,
    templateKey: claimTemplateKey,
  });

  const DAY_MAP: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const openingHours: object[] = [];
  if (r.hours_json && typeof r.hours_json === "object") {
    for (const [day, periods] of Object.entries(r.hours_json)) {
      const schemaDay = DAY_MAP[day.toLowerCase()];
      if (!schemaDay || !Array.isArray(periods)) continue;
      for (const p of periods) {
        if (p && typeof p === "object" && "open" in p && "close" in p) {
          openingHours.push({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: schemaDay,
            opens: (p as { open: string }).open,
            closes: (p as { close: string }).close,
          });
        }
      }
    }
  }

  const PRICE_MAP: Record<string, string> = {
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: r.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: r.address1,
      addressLocality: r.city,
      addressRegion: r.state,
      postalCode: r.zip,
      addressCountry: "US",
    },
    telephone: r.phone || undefined,
    servesCuisine: "Chinese",
    url: `https://chinese-takeout.com/${r.state_slug}/${r.city_slug}/${r.restaurant_slug}`,
    ...(r.website_url ? { sameAs: r.website_url } : {}),
    ...(r.lat && r.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: r.lat,
            longitude: r.lng,
          },
        }
      : {}),
    ...(r.rating && r.user_rating_count
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: r.rating,
            reviewCount: r.user_rating_count,
            bestRating: 5,
          },
        }
      : {}),
    ...(r.price_level && PRICE_MAP[r.price_level]
      ? { priceRange: PRICE_MAP[r.price_level] }
      : {}),
    ...(openingHours.length > 0
      ? { openingHoursSpecification: openingHours }
      : {}),
  };

  return (
    <article className="page-fade">
      {claimPreviewMode ? (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              [data-site-shell="header"],
              [data-site-shell="footer"] {
                display: none !important;
              }

              main[data-site-main="true"] {
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            `,
          }}
        />
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {!claimPreviewMode ? (
        <ListingOpenTracker
          stateSlug={r.state_slug}
          citySlug={r.city_slug}
          restaurantSlug={r.restaurant_slug}
          templateKey={templateKey}
        />
      ) : null}

      {!claimPreviewMode ? (
        <section className="mx-auto mt-4 w-full max-w-[1760px] px-6">
          <div className="rounded-2xl border border-[#e7d7c9] bg-white p-4 shadow-sm md:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
                  {r.is_claimed ? "Owner Launch Path" : "Website Preview Ready"}
                </p>
                <p className="mt-1 text-sm text-[#5f544b]">
                  {r.is_claimed
                    ? CORE_OWNER_PROMISE
                    : "See your recommended design, then verify ownership to launch."}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[#eadccf] bg-[#fff9f3] px-3 py-1 font-semibold uppercase tracking-[0.12em] text-[#7d6857]">
                    $299 setup + $99/mo
                  </span>
                  <span className="rounded-full border border-[#eadccf] bg-[#fff9f3] px-3 py-1 font-semibold uppercase tracking-[0.12em] text-[#7d6857]">
                    5-7 day launch
                  </span>
                  <span className="rounded-full border border-[#eadccf] bg-[#fff9f3] px-3 py-1 font-semibold uppercase tracking-[0.12em] text-[#7d6857]">
                    English | Chinese support
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <a
                  href={claimHref}
                  data-analytics-event="claim_cta_click"
                  data-analytics-payload={JSON.stringify({
                    source: "listing_launch_panel",
                    state_slug: r.state_slug,
                    city_slug: r.city_slug,
                    restaurant_slug: r.restaurant_slug,
                    template_key: templateKey,
                  })}
                  className="rounded-xl bg-[#c73f2f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ad3324]"
                >
                  {r.is_claimed ? "Claim & Launch" : "Preview Website"}
                </a>
                <a
                  href="tel:+18183420990"
                  className="rounded-xl border border-[#e0c9b7] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.11em] text-[#6e5a4c] hover:bg-[#fff8f2]"
                >
                  Call Support
                </a>
                <a
                  href="https://wa.me/18183420990"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-[#e0c9b7] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.11em] text-[#6e5a4c] hover:bg-[#fff8f2]"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {!claimPreviewMode ? (
        <TemplatePreviewToggle
          basePath={basePath}
          current={templateKey}
          stateSlug={r.state_slug}
          citySlug={r.city_slug}
          restaurantSlug={r.restaurant_slug}
          canSaveDefault={canSaveDefaultTemplate}
          currentFont={fontPreset}
          currentPalette={palette}
        />
      ) : null}

      {templateKey === "ming" ? (
        <TemplateMing
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          previewMode={previewMode}
          basePath={basePath}
          templateKey={templateKey}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}

      {templateKey === "ming-slim" ? (
        <TemplateMingSlim
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          previewMode={previewMode}
          basePath={basePath}
          templateKey={templateKey}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}

      {templateKey === "ming-balanced" ? (
        <TemplateMingBalanced
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          previewMode={previewMode}
          basePath={basePath}
          templateKey={templateKey}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}

      {templateKey === "ming-full" ? (
        <TemplateMingFull
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          previewMode={previewMode}
          basePath={basePath}
          templateKey={templateKey}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}

      {templateKey === "local-order" ? (
        <TemplateLocalOrder
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          previewMode={previewMode}
          basePath={basePath}
          templateKey={templateKey}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}

      {templateKey === "local-storefront" ? (
        <TemplateLocalStorefront
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          templateKey={templateKey}
          previewMode={previewMode}
          basePath={basePath}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}

      {templateKey === "local-express" ? (
        <TemplateLocalExpress
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          templateKey={templateKey}
          previewMode={previewMode}
          basePath={basePath}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}

      {templateKey === "local-feast" ? (
        <TemplateLocalFeast
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          templateKey={templateKey}
          previewMode={previewMode}
          basePath={basePath}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}

      {templateKey === "night-market" ? (
        <TemplateNightMarket
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          previewMode={previewMode}
          basePath={basePath}
          templateKey={templateKey}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}

      {templateKey === "wok-fire" ? (
        <TemplateWokFire
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          previewMode={previewMode}
          basePath={basePath}
          templateKey={templateKey}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}

      {templateKey === "metro-grid" ? (
        <TemplateMetroGrid
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          previewMode={previewMode}
          basePath={basePath}
          templateKey={templateKey}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}

      {templateKey === "editorial-column" ? (
        <TemplateEditorialColumn
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          previewMode={previewMode}
          basePath={basePath}
          templateKey={templateKey}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}

      {templateKey === "glass-orbit" ? (
        <TemplateGlassOrbit
          restaurant={r}
          menu={menu}
          reviews={reviews}
          gallery={gallery}
          hours={hours}
          specials={specials}
          tagline={tagline}
          highlights={highlights}
          mapsUrl={mapsUrl}
          previewMode={previewMode}
          basePath={basePath}
          templateKey={templateKey}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
          fontPreset={fontPreset}
          palette={palette}
        />
      ) : null}
    </article>
  );
}
