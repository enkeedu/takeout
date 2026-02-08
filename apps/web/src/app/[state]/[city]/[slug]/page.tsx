import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { MenuOut, RestaurantDetail } from "@/lib/types";
import { menuFromApi } from "@/lib/menu";
import {
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
import { TemplateNightMarket } from "@/components/restaurant-templates/TemplateNightMarket";
import { TemplateWokFire } from "@/components/restaurant-templates/TemplateWokFire";
import { TemplateMetroGrid } from "@/components/restaurant-templates/TemplateMetroGrid";
import { TemplateEditorialColumn } from "@/components/restaurant-templates/TemplateEditorialColumn";
import { TemplateGlassOrbit } from "@/components/restaurant-templates/TemplateGlassOrbit";
import {
  TEMPLATE_KEYS,
  type TemplateKey,
} from "@/components/restaurant-templates/types";
import { TemplatePreviewToggle } from "@/components/TemplatePreviewToggle";
import {
  resolveFontPreset,
  resolvePalette,
} from "@/components/restaurant-templates/preview-options";

type Props = {
  params: Promise<{ state: string; city: string; slug: string }>;
  searchParams: Promise<{
    template?: string;
    font?: string;
    palette?: string;
  }>;
};

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

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function selectTemplateKey(
  restaurant: RestaurantDetail,
  requested: string | undefined
): TemplateKey {
  if (requested && TEMPLATE_KEYS.includes(requested as TemplateKey)) {
    return requested as TemplateKey;
  }
  if (
    restaurant.template_key &&
    TEMPLATE_KEYS.includes(restaurant.template_key as TemplateKey)
  ) {
    return restaurant.template_key as TemplateKey;
  }
  const seed = hashString(`${restaurant.id}-${restaurant.name}`);
  return TEMPLATE_KEYS[seed % TEMPLATE_KEYS.length];
}

const MOCK_MENU_TEMPLATE_KEYS: TemplateKey[] = [
  "metro-grid",
  "editorial-column",
  "glass-orbit",
];

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
  const [r, menuData] = await Promise.all([
    getRestaurant(state, city, slug),
    getMenu(state, city, slug),
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
  const reviews = buildMockReviews(r.name, r.city);
  const gallery = buildMockGallery(r.name);
  const specials = buildMockSpecials(r.name);
  const highlights = buildHighlights(r.name, r.city);
  const hours = buildHours(r.hours_json);
  const tagline = buildTagline(r.name, r.city);
  const mapsUrl = buildMapsUrl(r);
  const basePath = `/${r.state_slug}/${r.city_slug}/${r.restaurant_slug}`;
  const orderPath = basePath;

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <TemplatePreviewToggle
        basePath={basePath}
        current={templateKey}
        currentFont={fontPreset}
        currentPalette={palette}
      />

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
          basePath={basePath}
          templateKey={templateKey}
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
