import type { MetadataRoute } from "next";

const BASE_URL = "https://chinese-takeout.com";
const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL || "http://localhost:8001";

interface SlugEntry {
  state_slug: string;
  city_slug: string;
  restaurant_slug: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await fetch(`${INTERNAL_API_URL}/sitemap/slugs`);
  const slugs: SlugEntry[] = await res.json();

  // Collect unique states and cities
  const states = new Set<string>();
  const cities = new Set<string>();

  for (const s of slugs) {
    states.add(s.state_slug);
    cities.add(`${s.state_slug}/${s.city_slug}`);
  }

  const stateUrls: MetadataRoute.Sitemap = [...states].map((state) => ({
    url: `${BASE_URL}/${state}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const cityUrls: MetadataRoute.Sitemap = [...cities].map((path) => ({
    url: `${BASE_URL}/${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const restaurantUrls: MetadataRoute.Sitemap = slugs.map((s) => ({
    url: `${BASE_URL}/${s.state_slug}/${s.city_slug}/${s.restaurant_slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...stateUrls,
    ...cityUrls,
    ...restaurantUrls,
  ];
}
