import type { RestaurantDetail } from "@/lib/types";
import type {
  GalleryItem,
  HoursData,
  MenuCategory,
  Review,
  Special,
} from "@/lib/restaurantDemo";

export const TEMPLATE_KEYS = [
  "local-order",
  "local-storefront",
  "local-express",
  "local-feast",
  "ming",
  "ming-slim",
  "ming-balanced",
  "ming-full",
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export const BUYER_TEMPLATE_KEYS = [
  "local-order",
  "local-storefront",
  "local-express",
] as const;
export const OPERATOR_TEMPLATE_KEYS = ["local-feast"] as const;
export const LEGACY_TEMPLATE_KEYS = [
  "ming",
  "ming-slim",
  "ming-balanced",
  "ming-full",
] as const;
export const DEPLOYABLE_TEMPLATE_KEYS = [
  ...BUYER_TEMPLATE_KEYS,
  ...OPERATOR_TEMPLATE_KEYS,
] as const;

export type BuyerTemplateKey = (typeof BUYER_TEMPLATE_KEYS)[number];
export type OperatorTemplateKey = (typeof OPERATOR_TEMPLATE_KEYS)[number];
export type LegacyTemplateKey = (typeof LEGACY_TEMPLATE_KEYS)[number];
export type DeployableTemplateKey = (typeof DEPLOYABLE_TEMPLATE_KEYS)[number];
export type OrderingTemplateKey =
  | "local-order"
  | "local-storefront"
  | "local-express"
  | "local-feast";

export const DEFAULT_TEMPLATE_KEY: BuyerTemplateKey = "local-order";

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  "local-order": "Local Order",
  "local-storefront": "Storefront",
  "local-express": "Express",
  "local-feast": "Feast",
  ming: "Ming",
  "ming-slim": "Ming Slim",
  "ming-balanced": "Ming Balanced",
  "ming-full": "Ming Full",
};

export type TemplateProfile = {
  stage: "Pioneer" | "Operator Lane" | "Style Lab";
  badge: string;
  headline: string;
  detail: string;
  bestFor: string;
  strengths: string[];
  focusPoints: string;
  fitTags: string[];
};

export const TEMPLATE_PROFILES: Record<TemplateKey, TemplateProfile> = {
  "local-order": {
    stage: "Pioneer",
    badge: "Recommended",
    headline: "Best default for most restaurant launches",
    detail:
      "Balanced, conversion-first direct ordering that fits most Chinese takeout menus without extra complexity.",
    bestFor:
      "Owners who want the clearest path from listing to launch with the strongest all-around direct-order default.",
    strengths: [
      "Category-first menu browsing",
      "Quick item customization",
      "Strongest broad-fit launch default",
    ],
    focusPoints: "trust, clarity, and the safest overall launch path",
    fitTags: ["Most restaurants", "Google/Yelp traffic", "Safest default"],
  },
  "local-storefront": {
    stage: "Pioneer",
    badge: "Brand-Forward",
    headline: "Best when restaurant identity should lead the page",
    detail:
      "A branded storefront feel up top with stronger hero presence, fast picks, and the same proven ordering engine underneath.",
    bestFor:
      "Owners who want a more polished restaurant-site first impression while keeping direct ordering obvious and fast.",
    strengths: [
      "Strongest hero and restaurant identity",
      "Fast picks and merchandising before the menu",
      "Same cart, customization, and checkout path",
    ],
    focusPoints: "brand presence, guest trust, and a faster menu handoff",
    fitTags: ["Brand-led", "Social/Maps traffic", "Restaurant-site feel"],
  },
  "local-express": {
    stage: "Pioneer",
    badge: "Fast-Pickup",
    headline: "Best for a faster, more app-like ordering flow",
    detail:
      "A tighter, denser ordering path with stronger cart awareness that feels closer to a direct-order app.",
    bestFor:
      "Owners who want a tighter phone-first ordering experience with faster scanning and stronger cart awareness.",
    strengths: [
      "Fastest menu handoff",
      "Stronger cart awareness and compact layout",
      "Best fit for phone-first repeat ordering",
    ],
    focusPoints: "speed, density, mobile ordering rhythm, and repeat use",
    fitTags: ["Lunch rush", "Fast pickup", "Phone-first diners"],
  },
  "local-feast": {
    stage: "Operator Lane",
    badge: "Operator Pick",
    headline: "Best for party trays, family bundles, and larger planned orders",
    detail:
      "A large-order shell that puts tray-friendly picks, serving guidance, and planning details ahead of the standard menu.",
    bestFor:
      "Restaurants we identify as strong fits for family dinners, office lunches, school events, or party-tray ordering when we want to guide guests into bigger baskets.",
    strengths: [
      "Large-order and tray-first positioning",
      "Lead-time and serving guidance near the top",
      "Same proven shared ordering engine underneath",
    ],
    focusPoints: "larger order value, clearer planning, and group-order confidence",
    fitTags: ["Party trays", "Family meals", "Office lunch"],
  },
  ming: {
    stage: "Style Lab",
    badge: "Style Lab",
    headline: "Classic storytelling concept",
    detail: "A softer, more narrative restaurant concept kept for internal comparison and style reference.",
    bestFor: "Internal style exploration, not the current launch path.",
    strengths: ["Strong hero imagery", "Softer story-first tone", "Useful style reference"],
    focusPoints: "visual direction and archived concept review",
    fitTags: ["Archived", "Story-first", "Internal only"],
  },
  "ming-slim": {
    stage: "Style Lab",
    badge: "Style Lab",
    headline: "Lean archival variant",
    detail: "A lightweight archived concept with simpler sections and a more minimal story path.",
    bestFor: "Internal comparison only.",
    strengths: ["Lightweight sections", "Simple story path", "Internal reference"],
    focusPoints: "archived concept comparison",
    fitTags: ["Archived", "Minimal", "Internal only"],
  },
  "ming-balanced": {
    stage: "Style Lab",
    badge: "Style Lab",
    headline: "Balanced archival variant",
    detail: "An archived concept that sits between story and order flow for internal reference.",
    bestFor: "Internal comparison only.",
    strengths: ["Balanced story + order panel", "Useful archive", "Internal reference"],
    focusPoints: "archived concept comparison",
    fitTags: ["Archived", "Balanced", "Internal only"],
  },
  "ming-full": {
    stage: "Style Lab",
    badge: "Style Lab",
    headline: "Rich archival variant",
    detail: "A richer content-heavy concept kept for style-lab comparison, not launch.",
    bestFor: "Internal comparison only.",
    strengths: ["Deeper sections", "Story-heavy tone", "Internal reference"],
    focusPoints: "archived concept comparison",
    fitTags: ["Archived", "Content-heavy", "Internal only"],
  },
};

export function isTemplateKey(value: string): value is TemplateKey {
  return TEMPLATE_KEYS.includes(value as TemplateKey);
}

export function isBuyerTemplateKey(value: string): value is BuyerTemplateKey {
  return BUYER_TEMPLATE_KEYS.includes(value as BuyerTemplateKey);
}

export function isOperatorTemplateKey(value: string): value is OperatorTemplateKey {
  return OPERATOR_TEMPLATE_KEYS.includes(value as OperatorTemplateKey);
}

export function isDeployableTemplateKey(value: string): value is DeployableTemplateKey {
  return DEPLOYABLE_TEMPLATE_KEYS.includes(value as DeployableTemplateKey);
}

export function isLegacyTemplateKey(value: string): value is LegacyTemplateKey {
  return LEGACY_TEMPLATE_KEYS.includes(value as LegacyTemplateKey);
}

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
  orderPath: string;
  orderingEnabled: boolean;
}
