import { Inter, Space_Grotesk } from "next/font/google";
import { formatPrice } from "@/lib/restaurantDemo";
import { OrderPanel } from "./OrderPanel";
import { OpeningHoursPanel } from "./OpeningHoursPanel";
import { buildTemplateRootStyle } from "./preview-options";
import type { RestaurantTemplateProps } from "./types";

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

export function TemplateMetroGrid({
  restaurant,
  menu,
  reviews,
  gallery,
  hours,
  specials,
  tagline,
  highlights,
  mapsUrl,
  orderPath,
  orderingEnabled,
  fontPreset,
  palette,
}: RestaurantTemplateProps) {
  const items = menu.flatMap((category) => category.items);
  const featuredItems = items.slice(0, 8);
  const menuBlocks = menu.slice(0, 4);
  const rootStyle = buildTemplateRootStyle(fontPreset, palette);
  const ratingValue = restaurant.rating ? restaurant.rating.toFixed(1) : "4.7";
  const reviewLabel = restaurant.user_rating_count
    ? `${restaurant.user_rating_count.toLocaleString()} reviews`
    : "Newly listed";

  return (
    <div
      className={`${display.variable} ${body.variable} [font-family:var(--font-body)] text-slate-900`}
      style={rootStyle}
    >
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#f5f7fb]">
        <div className="mx-auto max-w-[1760px] px-6 py-8 md:py-12">
          <section className="full-bleed relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-100/60 blur-3xl" />
            <div className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-cyan-100/60 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--template-accent)]">
                  Metro Grid
                </p>
                <h1 className="max-w-3xl text-4xl leading-tight [font-family:var(--font-display)] md:text-6xl">
                  {restaurant.name}
                </h1>
                <p className="max-w-2xl text-base text-slate-600 md:text-lg">
                  {tagline}
                </p>

                <div className="flex flex-wrap gap-2">
                  {highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-[var(--template-accent)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--template-accent)]"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="#order"
                    className="rounded-xl bg-[var(--template-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--template-accent-strong)] hover:text-black"
                  >
                    Start order
                  </a>
                  {restaurant.phone ? (
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-[var(--template-accent)] hover:text-[var(--template-accent)]"
                    >
                      Call {restaurant.phone}
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Rating
                  </p>
                  <p className="mt-2 text-3xl [font-family:var(--font-display)]">
                    {ratingValue}
                  </p>
                  <p className="text-sm text-slate-600">{reviewLabel}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Location
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {restaurant.city}, {restaurant.state}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{restaurant.zip}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Address
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {restaurant.address1}
                    {restaurant.address2 ? `, ${restaurant.address2}` : ""}
                  </p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-[var(--template-accent)] hover:text-[var(--template-accent-strong)]"
                  >
                    Open maps
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--template-accent)]">
                      Quick Menu
                    </p>
                    <h2 className="mt-1 text-3xl [font-family:var(--font-display)]">
                      Popular picks
                    </h2>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {featuredItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-slate-900">
                          {item.name}
                        </h3>
                        <span className="text-sm font-semibold text-[var(--template-accent)]">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {menuBlocks.map((category) => (
                  <div
                    key={category.name}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm [font-family:var(--font-display)] uppercase tracking-[0.18em] text-[var(--template-accent)]">
                        {category.name}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {category.items.length} items
                      </span>
                    </div>
                    <div className="space-y-2">
                      {category.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <span className="truncate">{item.name}</span>
                          <span className="flex-1 border-b border-dotted border-slate-300" />
                          <span className="font-semibold text-[var(--template-accent)]">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside id="order" className="space-y-6">
              <OrderPanel
                restaurantName={restaurant.name}
                menu={menu}
                variant="metro-grid"
                orderPath={orderPath}
                orderingEnabled={orderingEnabled}
              />
              <OpeningHoursPanel
                hours={hours}
                assetBase="/templates/ming"
                title="Hours"
              />
            </aside>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--template-accent)]">
                Reviews
              </p>
              <div className="mt-4 space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-500">
                      <span>{review.name}</span>
                      <span>{review.source}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">"{review.quote}"</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--template-accent)]">
                Snapshot
              </p>
              <div className="mt-4 space-y-3">
                {gallery.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border border-slate-200 p-4 ${item.themeClass}`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">
                      {item.label}
                    </p>
                  </div>
                ))}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Special tonight
                  </p>
                  <p className="mt-2 text-lg [font-family:var(--font-display)]">
                    {specials[0]?.title ?? "Chef Special"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {specials[0]?.description ?? "House favorite prepared fresh."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
