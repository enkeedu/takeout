export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  popular?: boolean;
  spice?: 0 | 1 | 2;
};

export type MenuCategory = {
  name: string;
  items: MenuItem[];
};

export type Review = {
  id: string;
  name: string;
  rating: number;
  quote: string;
  source: string;
};

export type GalleryItem = {
  id: string;
  label: string;
  themeClass: string;
};

export type HoursRow = {
  day: string;
  hours: string;
};

export type HoursData = {
  rows: HoursRow[];
  isSample: boolean;
};

export type Special = {
  id: string;
  title: string;
  description: string;
  price: string;
};

const BASE_MENU: MenuCategory[] = [
  {
    name: "Appetizers",
    items: [
      {
        id: "spring-rolls",
        name: "Crispy Spring Rolls",
        description: "Cabbage, carrot, and glass noodle with sweet chili.",
        price: 6.5,
        popular: true,
      },
      {
        id: "potstickers",
        name: "Pan-Seared Potstickers",
        description: "Pork and chive dumplings with black vinegar dip.",
        price: 8.0,
      },
      {
        id: "scallion-pancake",
        name: "Scallion Pancake",
        description: "Flaky layers, sesame, served with soy ginger.",
        price: 7.0,
      },
      {
        id: "salt-pepper-tofu",
        name: "Salt & Pepper Tofu",
        description: "Crispy tofu, garlic, scallion, and chili.",
        price: 9.5,
        spice: 1,
      },
    ],
  },
  {
    name: "Noodles & Rice",
    items: [
      {
        id: "house-fried-rice",
        name: "House Fried Rice",
        description: "BBQ pork, egg, peas, scallion, and soy.",
        price: 12.5,
        popular: true,
      },
      {
        id: "chow-fun",
        name: "Beef Chow Fun",
        description: "Wide rice noodles, bean sprouts, scallion.",
        price: 14.0,
      },
      {
        id: "lo-mein",
        name: "Vegetable Lo Mein",
        description: "Cabbage, carrot, mushroom, garlic sauce.",
        price: 11.5,
      },
      {
        id: "spicy-dan-dan",
        name: "Spicy Dan Dan",
        description: "Sesame chili sauce, ground pork, peanuts.",
        price: 13.5,
        spice: 2,
      },
    ],
  },
  {
    name: "Chef's Specials",
    items: [
      {
        id: "orange-chicken",
        name: "Crispy Orange Chicken",
        description: "Citrus glaze, toasted sesame, orange peel.",
        price: 15.0,
        popular: true,
      },
      {
        id: "kung-pao",
        name: "Kung Pao Chicken",
        description: "Peanuts, bell pepper, Sichuan chili.",
        price: 15.5,
        spice: 2,
      },
      {
        id: "beef-broccoli",
        name: "Beef & Broccoli",
        description: "Oyster sauce, garlic, tender flank steak.",
        price: 16.0,
      },
      {
        id: "szechuan-eggplant",
        name: "Szechuan Eggplant",
        description: "Sweet heat glaze, basil, charred scallion.",
        price: 14.0,
        spice: 1,
      },
    ],
  },
];

const TAGLINES = [
  "Hand-tossed wok classics and neighborhood favorites.",
  "Fresh, fast, and full of flavor made to order.",
  "Family recipes, bold sauces, and comforting bowls.",
  "Wok-seared specialties with a cozy hometown feel.",
];

const REVIEW_SNIPPETS = [
  "Everything tasted fresh and the sauce balance was perfect.",
  "Best takeout in town. The lo mein is always a hit.",
  "Super fast pickup and the portions are generous.",
  "Crispy chicken stayed crunchy even after the drive home.",
  "Clean flavors, not greasy, and the staff is friendly.",
];

const GALLERY_THEMES = [
  "bg-[linear-gradient(135deg,#fff1f2,#fde68a)]",
  "bg-[linear-gradient(135deg,#ecfeff,#fde68a)]",
  "bg-[linear-gradient(135deg,#dcfce7,#fed7aa)]",
  "bg-[linear-gradient(135deg,#e0f2fe,#fee2e2)]",
  "bg-[linear-gradient(135deg,#fef3c7,#fde68a)]",
];

const SPECIALS: Special[] = [
  {
    id: "family-feast",
    title: "Family Feast",
    description: "Two entrees, fried rice, and egg rolls.",
    price: "$36",
  },
  {
    id: "lunch-bento",
    title: "Lunch Bento",
    description: "Entree, salad, and steamed rice.",
    price: "$14",
  },
  {
    id: "chef-combo",
    title: "Chef's Combo",
    description: "Orange chicken and beef broccoli.",
    price: "$22",
  },
];

const FALLBACK_HOURS: HoursRow[] = [
  { day: "Mon", hours: "11:00 AM - 9:30 PM" },
  { day: "Tue", hours: "11:00 AM - 9:30 PM" },
  { day: "Wed", hours: "11:00 AM - 9:30 PM" },
  { day: "Thu", hours: "11:00 AM - 9:30 PM" },
  { day: "Fri", hours: "11:00 AM - 10:00 PM" },
  { day: "Sat", hours: "12:00 PM - 10:00 PM" },
  { day: "Sun", hours: "12:00 PM - 9:00 PM" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function slugifyId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function shiftArray<T>(items: T[], shiftBy: number): T[] {
  if (items.length === 0) return items;
  const shift = ((shiftBy % items.length) + items.length) % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function buildTagline(name: string, city: string): string {
  const seed = hashString(`${name}-${city}`);
  const base = TAGLINES[seed % TAGLINES.length];
  return base;
}

export function buildMockMenu(name: string): MenuCategory[] {
  const seed = hashString(name);
  const categoryShift = seed % BASE_MENU.length;
  const menu = shiftArray(BASE_MENU, categoryShift).map((category, index) => {
    const itemShift = (seed + index) % category.items.length;
    const items = shiftArray(category.items, itemShift).map((item, itemIndex) => {
      const priceBump = ((seed + itemIndex) % 3) * 0.5;
      const price = Math.round((item.price + priceBump) * 100) / 100;
      return {
        ...item,
        id: `${slugifyId(category.name)}-${slugifyId(item.name)}`,
        price,
      };
    });
    return { ...category, items };
  });
  return menu;
}

export function buildMockReviews(name: string, city: string): Review[] {
  const seed = hashString(`${name}-${city}`);
  const reviewers = ["Maya L.", "Devon K.", "Chris P.", "Jamie S.", "Riley A."];
  const sources = ["Google", "Yelp", "DoorDash", "Uber Eats", "Grubhub"];
  const shuffledReviews = shiftArray(REVIEW_SNIPPETS, seed % REVIEW_SNIPPETS.length);
  return shuffledReviews.slice(0, 3).map((quote, index) => ({
    id: `${seed}-${index}`,
    name: reviewers[(seed + index) % reviewers.length],
    rating: 4.6 + ((seed + index) % 3) * 0.1,
    quote,
    source: sources[(seed + index * 2) % sources.length],
  }));
}

export function buildMockGallery(name: string): GalleryItem[] {
  const seed = hashString(name);
  const shiftedThemes = shiftArray(GALLERY_THEMES, seed % GALLERY_THEMES.length);
  return [
    {
      id: `${seed}-hero`,
      label: "Signature bowl",
      themeClass: shiftedThemes[0],
    },
    {
      id: `${seed}-wok`,
      label: "Wok-fired classic",
      themeClass: shiftedThemes[1],
    },
    {
      id: `${seed}-sides`,
      label: "Fresh sides",
      themeClass: shiftedThemes[2],
    },
  ];
}

export function buildMockSpecials(name: string): Special[] {
  const seed = hashString(name);
  return shiftArray(SPECIALS, seed % SPECIALS.length).slice(0, 3);
}

export function buildHighlights(name: string, city: string): string[] {
  const seed = hashString(`${name}-${city}`);
  const options = [
    "Family-owned and operated",
    "No shortcuts, made fresh",
    "Pickup in 20-30 minutes",
    "Delivery within 4 miles",
    "Catering trays available",
    "Lunch specials every weekday",
  ];
  const highlights = shiftArray(options, seed % options.length);
  return highlights.slice(0, 3);
}

function normalizeDayLabel(key: string): string {
  const normalized = key.trim().toLowerCase();
  const map: Record<string, string> = {
    monday: "Mon",
    mon: "Mon",
    tuesday: "Tue",
    tue: "Tue",
    wednesday: "Wed",
    wed: "Wed",
    thursday: "Thu",
    thu: "Thu",
    friday: "Fri",
    fri: "Fri",
    saturday: "Sat",
    sat: "Sat",
    sunday: "Sun",
    sun: "Sun",
  };
  return map[normalized] || key;
}

function formatTime24to12(time24: string): string {
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${ampm}`;
}

function formatPeriod(entry: { open?: string; close?: string }): string | null {
  if (!entry.open || !entry.close) return null;
  return `${formatTime24to12(entry.open)} - ${formatTime24to12(entry.close)}`;
}

export function buildHours(
  hoursJson: Record<string, unknown> | null | undefined
): HoursData {
  if (!hoursJson || typeof hoursJson !== "object") {
    return { rows: FALLBACK_HOURS, isSample: true };
  }

  const rows: HoursRow[] = [];
  for (const [key, value] of Object.entries(hoursJson)) {
    if (typeof value === "string") {
      rows.push({ day: normalizeDayLabel(key), hours: value });
      continue;
    }
    if (Array.isArray(value)) {
      const formatted = value
        .map((entry) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object" && "open" in entry) {
            return formatPeriod(entry as { open?: string; close?: string });
          }
          return null;
        })
        .filter(Boolean)
        .join(", ");
      if (formatted) {
        rows.push({ day: normalizeDayLabel(key), hours: formatted });
      }
    }
  }

  if (rows.length === 0) {
    return { rows: FALLBACK_HOURS, isSample: true };
  }

  // Build a map of parsed days, then fill in all 7 days (missing = Closed)
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const parsed = new Map(rows.map((r) => [r.day, r.hours]));
  const allDays: HoursRow[] = dayLabels.map((day) => ({
    day,
    hours: parsed.get(day) || "Closed",
  }));

  return { rows: allDays, isSample: false };
}
