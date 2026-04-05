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
  "local-order",
  "local-storefront",
  "local-express",
  "local-feast",
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
  "night-market": "Night Market",
  "wok-fire": "Wok Fire",
  "metro-grid": "Metro Grid",
  "editorial-column": "Editorial Column",
  "glass-orbit": "Glass Orbit",
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
    headline: "Best default for most restaurant websites",
    detail:
      "A balanced website layout that fits most Chinese takeout restaurants without extra complexity.",
    bestFor:
      "Owners who want the clearest path from listing to a polished website with the strongest all-around default.",
    strengths: [
      "Clear business information hierarchy",
      "Strong all-around website presentation",
      "Strongest broad-fit default",
    ],
    focusPoints: "trust, clarity, and the safest overall website path",
    fitTags: ["Most restaurants", "Google/Yelp traffic", "Safest default"],
  },
  "local-storefront": {
    stage: "Pioneer",
    badge: "Brand-Forward",
    headline: "Best when restaurant identity should lead the page",
    detail:
      "A branded storefront feel up top with stronger hero presence and a clearer restaurant-site first impression.",
    bestFor:
      "Owners who want a more polished restaurant-site first impression with stronger branding and visual identity.",
    strengths: [
      "Strongest hero and restaurant identity",
      "Best branded storefront presentation",
      "Clean path from discovery to website trust",
    ],
    focusPoints: "brand presence, guest trust, and a stronger website first impression",
    fitTags: ["Brand-led", "Social/Maps traffic", "Restaurant-site feel"],
  },
  "local-express": {
    stage: "Pioneer",
    badge: "Fast-Pickup",
    headline: "Best for a tighter, simpler website presentation",
    detail:
      "A tighter, denser website presentation with a faster phone-first feel and compact information layout.",
    bestFor:
      "Owners who want a tighter phone-first website experience with faster scanning and a denser information layout.",
    strengths: [
      "Fastest compact layout",
      "Stronger phone-first feel",
      "Best fit for owners who want a tighter presentation",
    ],
    focusPoints: "speed, density, mobile scanning rhythm, and repeat discovery",
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
  "night-market": {
    stage: "Style Lab",
    badge: "Theme Lab",
    headline: "Neon-forward late-night concept",
    detail: "An experimental layout for louder nightlife energy and high-contrast merchandising.",
    bestFor: "Internal design exploration and specific nightlife brand fits.",
    strengths: ["High-contrast visual system", "Bold merch moments", "Distinct late-night tone"],
    focusPoints: "visual experimentation and differentiated mood",
    fitTags: ["Experimental", "Nightlife", "Internal only"],
  },
  "wok-fire": {
    stage: "Style Lab",
    badge: "Theme Lab",
    headline: "High-heat hero concept",
    detail: "A more intense archival variant built around bold hero moments and action-heavy visuals.",
    bestFor: "Internal comparison when a sharper, more energetic concept is worth testing.",
    strengths: ["Stronger hero emphasis", "Punchier accent system", "Useful comparison point"],
    focusPoints: "energy, contrast, and concept testing",
    fitTags: ["Experimental", "Bold", "Internal only"],
  },
  "metro-grid": {
    stage: "Style Lab",
    badge: "Layout Lab",
    headline: "Grid-first city layout",
    detail: "A modular concept exploring denser structure, editorial cards, and urban storefront framing.",
    bestFor: "Internal testing of alternate content hierarchy and storefront storytelling.",
    strengths: ["Dense modular layout", "Editorial card rhythm", "Alternative hierarchy"],
    focusPoints: "layout experimentation and storefront framing",
    fitTags: ["Experimental", "Grid", "Internal only"],
  },
  "editorial-column": {
    stage: "Style Lab",
    badge: "Layout Lab",
    headline: "Story-led editorial layout",
    detail: "A concept that leans into narrative pacing and magazine-style sections for design review.",
    bestFor: "Internal review when comparing more editorial brand presentations.",
    strengths: ["Narrative pacing", "Magazine-style sections", "Stronger storytelling"],
    focusPoints: "editorial hierarchy and narrative feel",
    fitTags: ["Experimental", "Editorial", "Internal only"],
  },
  "glass-orbit": {
    stage: "Style Lab",
    badge: "Theme Lab",
    headline: "Glassmorphism concept study",
    detail: "A future-facing visual system kept for internal comparison rather than launch deployment.",
    bestFor: "Internal theme exploration when testing more atmospheric visual directions.",
    strengths: ["Distinct visual mood", "Layered glass treatment", "Useful style comparison"],
    focusPoints: "atmosphere, motion, and visual range",
    fitTags: ["Experimental", "Atmospheric", "Internal only"],
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
  fontPreset: FontPresetKey;
  palette: PaletteKey;
}
