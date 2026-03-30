import { Cormorant_Garamond, Inter } from "next/font/google";
import { formatPrice } from "@/lib/restaurantDemo";
import type { RestaurantTemplateProps } from "./types";
import { LocalOrderBoard } from "./LocalOrderBoard";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const IMAGE_POOL = [
  "/templates/ming/menu-1.webp",
  "/templates/ming/menu-2.webp",
  "/templates/ming/menu-3.webp",
  "/templates/ming/menu-4.webp",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function showcaseImageUrl(seed: string) {
  return IMAGE_POOL[hashString(seed) % IMAGE_POOL.length];
}

function todayHoursLabel(days: RestaurantTemplateProps["hours"]["rows"]): string {
  const todayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
  return days.find((row) => row.day.startsWith(todayLabel))?.hours || days[0]?.hours || "Call for hours";
}

function roundToFive(value: number): number {
  return Math.ceil(value / 5) * 5;
}

function trayStartingPrice(basePrice: number, index: number): string {
  const multiplier = [4.25, 5.5, 6.25, 7.25][index] ?? 5.5;
  return formatPrice(roundToFive(Math.max(basePrice * multiplier, 50)));
}

const SERVING_LABELS = ["Feeds 4-6", "Feeds 6-8", "Feeds 8-10", "Feeds 10-12"] as const;
const OCCASION_LABELS = [
  "Family dinner",
  "Office lunch",
  "School event",
  "Weekend party",
] as const;

export function TemplateLocalFeast({
  restaurant,
  menu,
  reviews,
  hours,
  tagline,
  highlights,
  specials,
  mapsUrl,
  orderPath,
  orderingEnabled,
  previewMode,
}: RestaurantTemplateProps) {
  const todayHours = todayHoursLabel(hours.rows);
  const allItems = menu.flatMap((category) =>
    category.items.map((item) => ({ ...item, categoryName: category.name }))
  );
  const trayCandidates = allItems
    .filter((item) => item.popular || item.price >= 14)
    .slice(0, 4);
  const showcaseItems = trayCandidates.length ? trayCandidates : allItems.slice(0, 4);
  const featuredSignals = [
    specials[0]?.title || "Party trays",
    specials[1]?.title || "Family bundles",
    "Office lunch orders",
  ].slice(0, 3);
  const firstReview = reviews[0];
  const ratingAverage = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : null;
  const fulfillmentSummary =
    restaurant.has_takeout && restaurant.has_delivery
      ? "Pickup + local delivery"
      : restaurant.has_delivery
        ? "Delivery available"
        : "Pickup ready";
  const phoneHref = restaurant.phone ? `tel:${restaurant.phone.replace(/[^\d+]/g, "")}` : mapsUrl;
  const leadTimeLabel = restaurant.has_delivery
    ? "24-hour notice recommended for larger delivery orders"
    : "24-hour notice recommended for larger pickup orders";
  const planningSteps = [
    "Pick tray-friendly favorites first, then fill in sides and rice.",
    "Use checkout notes for guest count, pickup window, or event timing.",
    "Call support for same-day tray availability or delivery questions.",
  ];

  return (
    <div className={`${display.variable} ${body.variable} font-[var(--font-body)] text-[#241d17]`}>
      <div className="viewport-bleed bg-[linear-gradient(180deg,#faf3ed_0%,#f8f1e9_44%,#fcf7f1_100%)]">
        <div className="mx-auto flex max-w-[1760px] flex-col gap-6 px-5 py-6 md:px-6 md:py-8">
          <section className="overflow-hidden rounded-[32px] border border-[#dccdc0] bg-white shadow-[0_24px_80px_rgba(58,33,17,0.08)]">
            <div className="relative overflow-hidden bg-[#22140f] text-white">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-45"
                style={{ backgroundImage: "url('/templates/ming/hero.webp')" }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(28,17,12,0.9)_0%,rgba(28,17,12,0.72)_46%,rgba(74,39,20,0.86)_100%)]" />

              <div className="relative grid gap-5 px-5 py-6 md:px-8 md:py-8 xl:grid-cols-[1.12fr_0.88fr] xl:items-end">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f6d4c2]">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                      Feast
                    </span>
                    <span className="rounded-full border border-[#f0c5b2] bg-[#fff0e8] px-3 py-1.5 text-[#5b2914]">
                      Large-order lane
                    </span>
                    {previewMode ? (
                      <span className="rounded-full border border-[#d5dff0] bg-[#f7faff] px-3 py-1.5 text-[#35548c]">
                        Template preview
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f3c6ad]">
                      Party Trays + Family Bundles
                    </p>
                    <h1 className="font-[var(--font-display)] text-5xl font-semibold leading-[0.94] md:text-6xl">
                      {restaurant.name}
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-[#f6ddd0] md:text-base">
                      {tagline} Built for office lunches, family dinners, school events, and
                      party trays when guests need more than a quick single-meal order.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffe7dc]">
                    <span className="rounded-full border border-white/12 bg-black/22 px-3 py-1.5">
                      {leadTimeLabel}
                    </span>
                    <span className="rounded-full border border-white/12 bg-black/22 px-3 py-1.5">
                      {fulfillmentSummary}
                    </span>
                    <span className="rounded-full border border-white/12 bg-black/22 px-3 py-1.5">
                      Event notes at checkout
                    </span>
                    {ratingAverage ? (
                      <span className="rounded-full border border-white/12 bg-black/22 px-3 py-1.5">
                        {ratingAverage} star local signal
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href="#large-order-picks"
                      className="inline-flex items-center justify-center rounded-full bg-[#fff1e8] px-5 py-3 text-sm font-semibold text-[#412115] transition-transform hover:-translate-y-0.5 hover:bg-white"
                    >
                      Browse Large-Order Picks
                    </a>
                    <a
                      href="#menu"
                      className="inline-flex items-center justify-center rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/18"
                    >
                      Open Full Menu
                    </a>
                    <a
                      href={phoneHref}
                      className="inline-flex items-center justify-center rounded-full border border-white/18 bg-black/18 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/30"
                    >
                      Call for Timing
                    </a>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/12 bg-white/8 p-4 backdrop-blur-md">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2c7ae]">
                    Large Order Snapshot
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#dcb9a8]">Best Notice</p>
                      <p className="mt-1 text-sm font-semibold text-white">24 hours recommended</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#dcb9a8]">Pickup Window</p>
                      <p className="mt-1 text-sm font-semibold text-white">20-35 min standard, longer for trays</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#dcb9a8]">Service</p>
                      <p className="mt-1 text-sm font-semibold text-white">{fulfillmentSummary}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#dcb9a8]">Open Today</p>
                      <p className="mt-1 text-sm font-semibold text-white">{todayHours}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[22px] border border-white/10 bg-black/18 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#dcb9a8]">
                      Best Fit Orders
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {featuredSignals.map((signal) => (
                        <span
                          key={signal}
                          className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#ffe7dc]"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 border-t border-[#e8ddd3] bg-[#fcfaf7] px-5 py-5 md:px-6 xl:grid-cols-[0.78fr_1.22fr]">
              <div className="rounded-[26px] border border-[#e4d8cb] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a34a22]">
                  Plan The Order
                </p>
                <p className="mt-3 text-base text-[#544940]">
                  The strongest large-order pages make the rules easy to see before guests start
                  adding food. This shell keeps the basics visible and moves quickly into tray-friendly picks.
                </p>
                <div className="mt-4 space-y-3">
                  {planningSteps.map((step, index) => (
                    <div
                      key={step}
                      className="flex gap-3 rounded-2xl border border-[#eee3d9] bg-[#faf5ef] px-3 py-3"
                    >
                      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff1e8] text-sm font-semibold text-[#9b451f]">
                        {index + 1}
                      </div>
                      <p className="text-sm text-[#4d4038]">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {highlights.slice(0, 3).map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-[#eaded4] bg-[#faf4ed] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f5a49]"
                    >
                      {highlight}
                    </span>
                  ))}
                  <span className="rounded-full border border-[#eaded4] bg-[#fff8f2] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f5a49]">
                    Guest count notes welcome
                  </span>
                </div>

                {firstReview ? (
                  <div className="mt-4 rounded-2xl border border-[#eee3d9] bg-[#fff9f3] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d715f]">
                      Local Proof
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#2b221c]">
                      "{firstReview.quote}"
                    </p>
                    <p className="mt-1 text-xs text-[#78695d]">
                      {firstReview.name} via {firstReview.source}
                    </p>
                  </div>
                ) : null}
              </div>

              <div
                id="large-order-picks"
                className="rounded-[26px] border border-[#e4d8cb] bg-white p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a34a22]">
                      Group Favorites
                    </p>
                    <p className="mt-2 text-sm text-[#61544a]">
                      Lead with tray-friendly favorites, then let guests fill in rice, noodles, appetizers, and extra sides from the full menu below.
                    </p>
                  </div>
                  <a
                    href="#menu"
                    className="inline-flex shrink-0 rounded-full border border-[#ddd0c3] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5c4f45] transition-colors hover:bg-[#faf3ec]"
                  >
                    Browse Menu
                  </a>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {showcaseItems.map((item, index) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-[24px] border border-[#e4d8cb] bg-white shadow-sm"
                    >
                      <div
                        className="relative h-36 overflow-hidden border-b border-[#eaded4] bg-cover bg-center"
                        style={{ backgroundImage: `url(${showcaseImageUrl(item.id)})` }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,13,10,0.08)_0%,rgba(18,13,10,0.7)_100%)]" />
                        <div className="absolute left-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5d4d42]">
                          {SERVING_LABELS[index] || "Feeds a crowd"}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f1d8c8]">
                            {item.categoryName}
                          </p>
                          <h2 className="mt-1 text-2xl font-semibold text-white">{item.name}</h2>
                        </div>
                      </div>

                      <div className="space-y-3 p-4">
                        <p className="line-clamp-2 text-sm text-[#61544a]">{item.description}</p>
                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c6658]">
                          <span className="rounded-full border border-[#eaded4] bg-[#faf4ed] px-2.5 py-1">
                            {OCCASION_LABELS[index] || "Group order"}
                          </span>
                          <span className="rounded-full border border-[#eaded4] bg-[#fff8f2] px-2.5 py-1">
                            From {trayStartingPrice(item.price, index)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-[#231c17]">
                            Tray-friendly favorite
                          </span>
                          <a
                            href="#menu"
                            className="inline-flex rounded-full bg-[#2d1d16] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#412a20]"
                          >
                            Start With This
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <LocalOrderBoard
            restaurantName={restaurant.name}
            menu={menu}
            orderPath={orderPath}
            orderingEnabled={orderingEnabled}
            variant="local-feast"
          />
        </div>
      </div>
    </div>
  );
}
