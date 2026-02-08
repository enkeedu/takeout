import type { RestaurantDetail } from "@/lib/types";
import type { FontPresetKey, PaletteKey } from "./preview-options";
import type {
  GalleryItem,
  HoursData,
  MenuCategory,
  Review,
  Special,
} from "@/lib/restaurantDemo";

export const TEMPLATE_KEYS = [
  "ming",
  "ming-slim",
  "ming-balanced",
  "ming-full",
  "night-market",
  "wok-fire",
  "metro-grid",
  "editorial-column",
  "glass-orbit",
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  ming: "Ming",
  "ming-slim": "Ming Slim",
  "ming-balanced": "Ming Balanced",
  "ming-full": "Ming Full",
  "night-market": "Night Market",
  "wok-fire": "Wok Fire",
  "metro-grid": "Metro Grid",
  "editorial-column": "Editorial Column",
  "glass-orbit": "Glass Orbit",
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
  basePath: string;
  orderPath: string;
  orderingEnabled: boolean;
  fontPreset: FontPresetKey;
  palette: PaletteKey;
}
