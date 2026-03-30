import { Inter, Space_Grotesk } from "next/font/google";
import { formatPrice } from "@/lib/restaurantDemo";
import type { RestaurantTemplateProps } from "./types";
import { LocalOrderBoard } from "./LocalOrderBoard";

const display = Space_Grotesk({
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
  return (
    days.find((row) => row.day.startsWith(todayLabel))?.hours ||
    days[0]?.hours ||
    "Call for hours"
  );
}

export function TemplateLocalExpress({
  restaurant,
  menu,
  reviews,
  hours,
  tagline,
  mapsUrl,
  orderPath,
  orderingEnabled,
  previewMode,
}: RestaurantTemplateProps) {
  const todayHours = todayHoursLabel(hours.rows);
  const allItems = menu.flatMap((category) =>
    category.items.map((item) => ({ ...item, categoryName: category.name }))
  );
  const fastPicks = allItems.filter((item) => item.popular).slice(0, 4);
  const fallbackPicks = allItems.slice(0, 4);
  const showcaseItems = fastPicks.length ? fastPicks : fallbackPicks;
  const firstReview = reviews[0];
  const ratingAverage = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : null;
  const fulfillmentSummary =
    restaurant.has_takeout && restaurant.has_delivery
      ? "Pickup + delivery"
      : restaurant.has_delivery
        ? "Delivery available"
        : "Pickup ready";
  const phoneHref = restaurant.phone ? `tel:${restaurant.phone.replace(/[^\d+]/g, "")}` : mapsUrl;

  return (
    <div className={`${display.variable} ${body.variable} font-[var(--font-body)] text-[#1f2722]`}>
      <div className="viewport-bleed bg-[linear-gradient(180deg,#f9fbf7_0%,#f3f7f0_42%,#faf9f4_100%)]">
        <div className="mx-auto flex max-w-[1760px] flex-col gap-5 px-4 py-5 md:px-6 md:py-7">
          <section className="overflow-hidden rounded-[30px] border border-[#d8e0d4] bg-white shadow-[0_26px_80px_rgba(41,53,38,0.08)]">
            <div className="grid gap-4 px-4 py-4 md:px-5 md:py-5 xl:grid-cols-[minmax(0,1.08fr)_360px] xl:items-start">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6a746d]">
                  <span className="rounded-full border border-[#dce5d9] bg-[#f6faf4] px-3 py-1.5">
                    Express
                  </span>
                  <span className="rounded-full border border-[#f0d8cb] bg-[#fff4ee] px-3 py-1.5 text-[#cb5520]">
                    Mobile-first ordering
                  </span>
                  {previewMode ? (
                    <span className="rounded-full border border-[#dde5f2] bg-[#f7faff] px-3 py-1.5 text-[#35548c]">
                      Template preview
                    </span>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <h1 className="font-[var(--font-display)] text-[2.6rem] font-semibold leading-[0.92] tracking-[-0.03em] text-[#1b241f] md:text-[3.7rem]">
                    {restaurant.name}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-[#58625b] md:text-base">
                    {tagline} Order first, menu fast, cart always close by.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="#menu"
                    className="inline-flex items-center justify-center rounded-full bg-[#e8662b] px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#cf551f]"
                  >
                    Start Order
                  </a>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-[#d9e2d5] bg-white px-5 py-3 text-sm font-semibold text-[#314039] transition-colors hover:bg-[#f8fbf5]"
                  >
                    Call or Directions
                  </a>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#69736c]">
                  <span className="rounded-full border border-[#dde4d9] bg-[#f8fbf5] px-3 py-1.5">
                    Open today {todayHours}
                  </span>
                  <span className="rounded-full border border-[#dde4d9] bg-[#f8fbf5] px-3 py-1.5">
                    Pickup 15-25 min
                  </span>
                  <span className="rounded-full border border-[#dde4d9] bg-[#f8fbf5] px-3 py-1.5">
                    {fulfillmentSummary}
                  </span>
                  {ratingAverage ? (
                    <span className="rounded-full border border-[#dde4d9] bg-[#f8fbf5] px-3 py-1.5">
                      {ratingAverage} star local signal
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="overflow-hidden rounded-[26px] border border-[#dde4d9] bg-[linear-gradient(180deg,#fcfefb_0%,#f4f8f1_100%)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b746d]">
                      Start Fast
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#1b241f]">
                      Popular dishes first, full menu right after
                    </p>
                  </div>
                  <a
                    href="#menu"
                    className="rounded-full border border-[#d9e2d5] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4d5a52] transition-colors hover:bg-[#f8fbf5]"
                  >
                    Menu
                  </a>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {showcaseItems.slice(0, 2).map((item) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-[22px] border border-[#e2e8de] bg-white shadow-sm"
                    >
                      <div
                        className="h-28 bg-cover bg-center"
                        style={{ backgroundImage: `url(${showcaseImageUrl(item.id)})` }}
                      />
                      <div className="p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a837d]">
                          {item.categoryName}
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-[#1c2520]">{item.name}</h2>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-[#cf551f]">
                            {formatPrice(item.price)}
                          </span>
                          <a
                            href="#menu"
                            className="rounded-full border border-[#dfe6da] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#49564f] transition-colors hover:bg-[#f8fbf5]"
                          >
                            Add
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6d766f]">
                  <span className="rounded-full border border-[#dde4d9] bg-white px-3 py-1.5">
                    Menu-first flow
                  </span>
                  <span className="rounded-full border border-[#dde4d9] bg-white px-3 py-1.5">
                    {fulfillmentSummary}
                  </span>
                  {ratingAverage ? (
                    <span className="rounded-full border border-[#dde4d9] bg-white px-3 py-1.5">
                      {ratingAverage} local rating
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
            <div className="rounded-[28px] border border-[#dce4d8] bg-white p-4 shadow-sm md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cb5520]">
                    Popular Right Now
                  </p>
                  <p className="mt-1 text-sm text-[#616a63]">
                    Best-sellers first so guests can jump straight into ordering.
                  </p>
                </div>
                <a
                  href="#menu"
                  className="rounded-full border border-[#dbe4d7] bg-[#f8fbf5] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4e5a53] transition-colors hover:bg-white"
                >
                  Jump to Menu
                </a>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {showcaseItems.map((item, index) => (
                  <article
                    key={item.id}
                    className="flex items-center gap-3 rounded-[22px] border border-[#e3e9df] bg-[#fbfcf8] p-3"
                  >
                    <div
                      className="h-20 w-20 shrink-0 rounded-[18px] bg-cover bg-center"
                      style={{ backgroundImage: `url(${showcaseImageUrl(`${item.id}-${index}`)})` }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d867f]">
                        {item.categoryName}
                      </p>
                      <h3 className="truncate text-base font-semibold text-[#1d2620]">{item.name}</h3>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-[#cb5520]">
                          {formatPrice(item.price)}
                        </span>
                        <a
                          href="#menu"
                          className="rounded-full border border-[#dbe4d7] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4e5a53] transition-colors hover:bg-[#f8fbf5]"
                        >
                          Add
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-[#dce4d8] bg-white p-4 shadow-sm md:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cb5520]">
                  Order Snapshot
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-[#e1e8dd] bg-[#fbfcf8] p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a837d]">
                      Open Today
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#1b241f]">{todayHours}</p>
                  </div>
                  <div className="rounded-[22px] border border-[#e1e8dd] bg-[#fbfcf8] p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a837d]">
                      Pickup ETA
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#1b241f]">15-25 minutes</p>
                  </div>
                  <div className="rounded-[22px] border border-[#e1e8dd] bg-[#fbfcf8] p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a837d]">
                      Service
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#1b241f]">{fulfillmentSummary}</p>
                  </div>
                  <div className="rounded-[22px] border border-[#e1e8dd] bg-[#fbfcf8] p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a837d]">
                      Menu
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#1b241f]">Popular picks + full menu</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[#dce4d8] bg-[linear-gradient(180deg,#fff7f0_0%,#ffffff_100%)] p-4 shadow-sm md:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cb5520]">
                  Local Signal
                </p>
                <p className="mt-2 text-sm font-semibold text-[#1d2620]">
                  {ratingAverage
                    ? `${ratingAverage} stars from local guests`
                    : "Built for repeat neighborhood ordering"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#606962]">
                  {firstReview
                    ? firstReview.quote
                    : "Compact layout, fast category jumps, and a tighter cart-first rhythm."}
                </p>
                <p className="mt-2 text-xs text-[#7b847d]">
                  {firstReview
                    ? `${firstReview.name} via ${firstReview.source}`
                    : "Direct ordering, faster menu handoff, and stronger mobile pacing."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={phoneHref}
                    className="inline-flex items-center justify-center rounded-full bg-[#e8662b] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#cf551f]"
                  >
                    Call Store
                  </a>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-[#d9e2d5] bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#435149] transition-colors hover:bg-[#f8fbf5]"
                  >
                    Directions
                  </a>
                </div>
              </div>
            </div>
          </section>

          <LocalOrderBoard
            restaurantName={restaurant.name}
            menu={menu}
            orderPath={orderPath}
            orderingEnabled={orderingEnabled}
            variant="local-express"
          />
        </div>
      </div>
    </div>
  );
}
