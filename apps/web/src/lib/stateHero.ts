type StateHeroTheme = {
  eyebrow: string;
  headlineSuffix: string;
  supportingText: string;
  imagePath: string;
};

const DEFAULT_THEME: StateHeroTheme = {
  eyebrow: "State Market View",
  headlineSuffix: "Owner Market",
  supportingText:
    "See city-level Chinese restaurant opportunities, then choose where to launch your owner demo first.",
  imagePath: "/state-banners/default.svg",
};

const THEMES: Record<string, StateHeroTheme> = {
  CA: {
    eyebrow: "California Market View",
    headlineSuffix: "Golden State",
    supportingText:
      "From Golden Gate markets to Hollywood-heavy demand zones, pick the best city to launch direct ordering first.",
    imagePath: "/state-banners/ca.svg",
  },
  NY: {
    eyebrow: "New York Market View",
    headlineSuffix: "Empire State",
    supportingText:
      "From Statue of Liberty traffic to dense NYC neighborhoods, compare where owner conversion will be strongest.",
    imagePath: "/state-banners/ny.svg",
  },
  FL: {
    eyebrow: "Florida Market View",
    headlineSuffix: "Sunshine State",
    supportingText:
      "Use Miami-style, high-tourism city demand to prioritize the best launch point for web ordering and AI phone flow.",
    imagePath: "/state-banners/fl.svg",
  },
  IL: {
    eyebrow: "Illinois Market View",
    headlineSuffix: "Prairie State",
    supportingText:
      "Use Chicago-area demand signals, from skyline districts to neighborhood corridors, to pick your strongest launch point.",
    imagePath: "/state-banners/il.svg",
  },
  MA: {
    eyebrow: "Massachusetts Market View",
    headlineSuffix: "Bay State",
    supportingText:
      "Choose the right Massachusetts city cluster, from historic core markets to suburban growth pockets, and launch faster.",
    imagePath: "/state-banners/ma.svg",
  },
  NJ: {
    eyebrow: "New Jersey Market View",
    headlineSuffix: "Garden State",
    supportingText:
      "Compare New Jersey shore and inland city demand, then turn your listing into a conversion-ready owner website.",
    imagePath: "/state-banners/nj.svg",
  },
  TX: {
    eyebrow: "Texas Market View",
    headlineSuffix: "Lone Star State",
    supportingText:
      "Size city-by-city Texas demand and launch where direct web ordering can scale quickest for your restaurant.",
    imagePath: "/state-banners/tx.svg",
  },
  WA: {
    eyebrow: "Washington Market View",
    headlineSuffix: "Evergreen State",
    supportingText:
      "Evaluate Seattle-led markets and surrounding Washington cities, then launch where owner lift will happen fastest.",
    imagePath: "/state-banners/wa.svg",
  },
};

export function getStateHeroTheme(stateAbbreviation: string): StateHeroTheme {
  const key = stateAbbreviation.toUpperCase();
  return THEMES[key] || DEFAULT_THEME;
}
