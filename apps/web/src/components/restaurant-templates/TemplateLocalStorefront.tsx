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

export function TemplateLocalStorefront({
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
  const featuredItems = allItems.filter((item) => item.popular).slice(0, 3);
  const fallbackItems = allItems.slice(0, 3);
  const showcaseItems = featuredItems.length ? featuredItems : fallbackItems;
  const firstReview = reviews[0];
  const ratingAverage = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : null;
  const orderAnchorLabel = orderingEnabled ? "Order Now" : "View Menu";
  const fulfillmentTags = [
    restaurant.has_takeout ? "Pickup" : null,
    restaurant.has_delivery ? "Delivery" : null,
    "Direct Ordering",
  ].filter(Boolean) as string[];
  const serviceLabel = restaurant.has_delivery ? "Pickup & Delivery" : "Pickup Ready";
  const directOrderReasons = [
    restaurant.has_delivery ? "Local delivery available" : "Fast pickup windows",
    specials.length ? `${specials[0]?.title} available today` : "Best sellers surfaced first",
    "Shared direct-order cart flow",
  ];

  return (
    <div className={`${display.variable} ${body.variable} font-[var(--font-body)] text-[#241c17]`}>
      <div className="viewport-bleed bg-[linear-gradient(180deg,#f8f3ed_0%,#f4eee7_45%,#f8f3ed_100%)]">
        <div className="mx-auto flex max-w-[1760px] flex-col gap-6 px-5 py-6 md:px-6 md:py-8">
          <section className="overflow-hidden rounded-[32px] border border-[#d7cabd] bg-white shadow-[0_24px_80px_rgba(57,32,16,0.08)]">
            <div className="relative overflow-hidden bg-[#161210] text-white">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-55"
                style={{ backgroundImage: "url('/templates/ming/hero.webp')" }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(17,13,11,0.88)_0%,rgba(17,13,11,0.66)_48%,rgba(17,13,11,0.84)_100%)]" />

              <div className="relative grid gap-5 px-5 py-6 md:px-8 md:py-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
                <div>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <nav className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f6d6c6]">
                      <a
                        href="#about"
                        className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 transition-colors hover:bg-white/16"
                      >
                        About
                      </a>
                      <a
                        href="#best-sellers"
                        className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 transition-colors hover:bg-white/16"
                      >
                        Fast Picks
                      </a>
                      <a
                        href="#menu"
                        className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 transition-colors hover:bg-white/16"
                      >
                        Menu
                      </a>
                      <a
                        href="#hours"
                        className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 transition-colors hover:bg-white/16"
                      >
                        Hours
                      </a>
                    </nav>
                    <a
                      href="#menu"
                      className="inline-flex items-center justify-center rounded-full border border-[#f0d0bf] bg-[#fff1e8] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2b221c] transition-transform hover:-translate-y-0.5 hover:bg-white"
                    >
                      {orderAnchorLabel}
                    </a>
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f2c7ae]">
                    Restaurant Storefront
                  </p>
                  <h1 className="mt-2 font-[var(--font-display)] text-5xl font-semibold leading-[0.95] md:text-6xl">
                    {restaurant.name}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm text-[#f5ddd1] md:text-base">
                    {tagline} Order direct with a cleaner storefront, quick favorites, and a faster handoff
                    into the menu.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffeadf]">
                    {fulfillmentTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href="#menu"
                      className="inline-flex items-center justify-center rounded-full bg-[#fff1e8] px-5 py-3 text-sm font-semibold text-[#2b221c] transition-transform hover:-translate-y-0.5 hover:bg-white"
                    >
                      {orderAnchorLabel}
                    </a>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/18"
                    >
                      Call or Directions
                    </a>
                    {previewMode ? (
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-black/20 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffe7d8]">
                        Preview mode
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffe3d6]">
                    <span className="rounded-full border border-white/12 bg-black/22 px-3 py-1.5">
                      Pickup 20-35 min
                    </span>
                    <span className="rounded-full border border-white/12 bg-black/22 px-3 py-1.5">
                      Open today {todayHours}
                    </span>
                    {ratingAverage ? (
                      <span className="rounded-full border border-white/12 bg-black/22 px-3 py-1.5">
                        {ratingAverage} star local reviews
                      </span>
                    ) : null}
                  </div>
                </div>

                <div
                  id="hours"
                  className="rounded-[28px] border border-white/12 bg-white/8 p-4 backdrop-blur-md"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2c7ae]">
                    Storefront Snapshot
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#dcb9a8]">Open Today</p>
                      <p className="mt-1 text-sm font-semibold text-white">{todayHours}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#dcb9a8]">Pickup ETA</p>
                      <p className="mt-1 text-sm font-semibold text-white">20-35 min</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#dcb9a8]">Service</p>
                      <p className="mt-1 text-sm font-semibold text-white">{serviceLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#dcb9a8]">Call</p>
                      <p className="mt-1 text-sm font-semibold text-white">{restaurant.phone || "Call store"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffe3d6]">
                    <span className="rounded-full border border-white/12 bg-black/22 px-3 py-1.5">
                      {restaurant.address1}, {restaurant.city}
                    </span>
                    {ratingAverage ? (
                      <span className="rounded-full border border-white/12 bg-black/22 px-3 py-1.5">
                        {ratingAverage} stars from local diners
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 border-t border-[#e8ddd3] bg-[#fcfaf7] px-5 py-5 md:px-6 xl:grid-cols-[0.82fr_1.18fr]">
              <div id="about" className="rounded-[26px] border border-[#e4d8cb] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a34a22]">
                  Why Locals Order Here
                </p>
                <p className="mt-3 text-base text-[#544940]">
                  {tagline} The storefront keeps timing, favorites, and direct pickup details visible so
                  guests can order without extra friction.
                </p>
                <div className="mt-4 grid gap-2">
                  {directOrderReasons.map((reason) => (
                    <div
                      key={reason}
                      className="flex items-center justify-between rounded-2xl border border-[#eee3d9] bg-[#faf5ef] px-3 py-2.5 text-sm font-medium text-[#463b34]"
                    >
                      <span>{reason}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8d715f]">
                        Ready
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {highlights.slice(0, 4).map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-[#eaded4] bg-[#faf4ed] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f5a49]"
                    >
                      {highlight}
                    </span>
                  ))}
                  {ratingAverage ? (
                    <span className="rounded-full border border-[#eaded4] bg-[#fff8f2] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f5a49]">
                      {ratingAverage} star rating
                    </span>
                  ) : null}
                </div>
                {firstReview ? (
                  <div className="mt-4 rounded-2xl border border-[#eee3d9] bg-[#faf5ef] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d715f]">
                      Local Review
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#2b221c]">
                      &ldquo;{firstReview.quote}&rdquo;
                    </p>
                    <p className="mt-1 text-xs text-[#78695d]">
                      {firstReview.name} via {firstReview.source}
                    </p>
                  </div>
                ) : null}
                {specials.length ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d715f]">
                      Today
                    </p>
                    {specials.slice(0, 2).map((special) => (
                      <span
                        key={special.id}
                        className="rounded-full border border-[#ebddd0] bg-[#fffaf5] px-3 py-1.5 text-xs text-[#5c4f45]"
                      >
                        {special.title} - {special.price}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div id="best-sellers" className="rounded-[26px] border border-[#e4d8cb] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a34a22]">
                      Start With Fast Picks
                    </p>
                    <p className="mt-2 text-sm text-[#61544a]">
                      Tap a favorite for the quickest path into ordering, then keep browsing the full menu
                      below.
                    </p>
                  </div>
                  <a
                    href="#menu"
                    className="inline-flex shrink-0 rounded-full border border-[#ddd0c3] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5c4f45] transition-colors hover:bg-[#faf3ec]"
                  >
                    Browse Menu
                  </a>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {showcaseItems.map((item, index) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-[24px] border border-[#e4d8cb] bg-white shadow-sm"
                    >
                      <div
                        className="relative h-32 overflow-hidden border-b border-[#eaded4] bg-cover bg-center"
                        style={{ backgroundImage: `url(${showcaseImageUrl(item.id)})` }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,13,10,0.08)_0%,rgba(18,13,10,0.66)_100%)]" />
                        <div className="absolute left-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5d4d42]">
                          #{index + 1} pick
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f1d8c8]">
                            {item.categoryName}
                          </p>
                          <h2 className="mt-1 text-xl font-semibold text-white">{item.name}</h2>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="line-clamp-2 text-sm text-[#61544a]">{item.description}</p>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-[#231c17]">
                            {formatPrice(item.price)}
                          </span>
                          <a
                            href="#menu"
                            className="inline-flex rounded-full bg-[#2b221c] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#3a2c23]"
                          >
                            Start Order
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
            variant="local-storefront"
          />
        </div>
      </div>
    </div>
  );
}
