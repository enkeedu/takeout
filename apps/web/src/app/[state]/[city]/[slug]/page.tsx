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
import {
  TEMPLATE_KEYS,
  type TemplateKey,
} from "@/components/restaurant-templates/types";
import { TemplatePreviewToggle } from "@/components/TemplatePreviewToggle";

type Props = {
  params: Promise<{ state: string; city: string; slug: string }>;
  searchParams: Promise<{ template?: string; preview?: string }>;
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

function buildMapsUrl(restaurant: RestaurantDetail): string {
  if (restaurant.lat && restaurant.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`;
  }
  const fullAddress = `${restaurant.address1}, ${restaurant.city}, ${restaurant.state} ${restaurant.zip}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
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
  const menu = menuData ? menuFromApi(menuData) : buildMockMenu(r.name);
  const orderingEnabled = Boolean(menuData);
  const reviews = buildMockReviews(r.name, r.city);
  const gallery = buildMockGallery(r.name);
  const specials = buildMockSpecials(r.name);
  const highlights = buildHighlights(r.name, r.city);
  const hours = buildHours(r.hours_json);
  const tagline = buildTagline(r.name, r.city);
  const mapsUrl = buildMapsUrl(r);
  const basePath = `/${r.state_slug}/${r.city_slug}/${r.restaurant_slug}`;
  const orderPath = basePath;
  const previewMode = sp.preview === "1";

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
    ...(r.lat && r.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: r.lat,
            longitude: r.lng,
          },
        }
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
        stateSlug={r.state_slug}
        citySlug={r.city_slug}
        restaurantSlug={r.restaurant_slug}
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
          previewMode={previewMode}
          basePath={basePath}
          templateKey={templateKey}
          orderPath={orderPath}
          orderingEnabled={orderingEnabled}
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
        />
      ) : null}
    </article>
  );
}
