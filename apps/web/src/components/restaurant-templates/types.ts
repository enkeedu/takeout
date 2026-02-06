import type { RestaurantDetail } from "@/lib/types";
import type {
  GalleryItem,
  HoursData,
  MenuCategory,
  Review,
  Special,
} from "@/lib/restaurantDemo";

export const TEMPLATE_KEYS = ["market", "modern", "luxe"] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  market: "Market",
  modern: "Studio",
  luxe: "Luxe",
};

export interface RestaurantTemplateProps {
  restaurant: RestaurantDetail;
  menu: MenuCategory[];
  reviews: Review[];
  gallery: GalleryItem[];
  hours: HoursData;
  specials: Special[];
  tagline: string;
  highlights: string[];
  mapsUrl: string;
  templateKey: TemplateKey;
  previewMode: boolean;
  basePath: string;
}
