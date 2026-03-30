import { Cormorant_Garamond, Inter } from "next/font/google";
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

export function TemplateLocalOrder({
  restaurant,
  menu,
  hours,
  highlights,
  mapsUrl,
  orderPath,
  orderingEnabled,
  previewMode,
}: RestaurantTemplateProps) {
  const todayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
  const todayHours =
    hours.rows.find((row) => row.day.startsWith(todayLabel))?.hours ||
    hours.rows[0]?.hours ||
    "Call for hours";
  const orderAnchorLabel = orderingEnabled ? "Start Order" : "View Menu";

  return (
    <div
      className={`${display.variable} ${body.variable} font-[var(--font-body)] text-[#2d231b]`}
    >
      <div className="viewport-bleed bg-[#f4eee4]">
        <div className="mx-auto max-w-[1760px] space-y-6 px-6 py-8">
          <section className="overflow-hidden rounded-3xl border border-[#dacdbc] bg-white shadow-sm">
            <div className="relative overflow-hidden border-b border-[#e4d9cb] bg-[#130f0c] text-white">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-35"
                style={{ backgroundImage: "url('/templates/ming/hero.webp')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/70" />
              <div className="relative p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ffc9b6]">
                  Local Chinese Takeout Ordering
                </p>
                <h1 className="mt-2 font-[var(--font-display)] text-5xl font-semibold leading-tight md:text-6xl">
                  {restaurant.name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-[#f3ddd3] md:text-base">
                  Built for neighborhood Chinese restaurants: familiar categories,
                  quick item customization, and clear checkout.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#ffe3d6]">
                  {highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-[#ffffff33] bg-black/35 px-3 py-1"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#menu"
                    className="inline-flex items-center justify-center rounded-full bg-[#fff1ea] px-5 py-3 text-sm font-semibold text-[#9f2f27] transition-transform hover:-translate-y-0.5 hover:bg-white"
                  >
                    {orderAnchorLabel}
                  </a>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-[#ffffff3d] bg-black/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/40"
                  >
                    Call or Directions
                  </a>
                  {previewMode ? (
                    <span className="inline-flex items-center rounded-full border border-[#ffffff30] bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffe5d7]">
                      Previewing the live ordering flow
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4 md:p-5">
              <div className="rounded-2xl border border-[#e1d4c5] bg-[#faf6f0] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ab3128]">
                  Ordering
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2d231b]">
                  Pickup and delivery ready
                </p>
                <p className="mt-2 text-xs text-[#6e6257]">
                  Familiar direct-order flow built for fast Chinese takeout ordering.
                </p>
              </div>
              <div className="rounded-xl border border-[#e1d4c5] bg-[#faf6f0] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ab3128]">
                  Open Today
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2d231b]">{todayHours}</p>
                <p className="mt-2 text-xs text-[#6e6257]">
                  Live hours at the top so guests know they can order right now.
                </p>
              </div>
              <div className="rounded-xl border border-[#e1d4c5] bg-[#faf6f0] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ab3128]">
                  Pickup ETA
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2d231b]">20-35 minutes</p>
                <p className="mt-2 text-xs text-[#6e6257]">
                  Clear timing upfront reduces hesitation before guests start building an order.
                </p>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-[#e1d4c5] bg-[#faf6f0] p-4 transition-colors hover:bg-[#f2e8dc]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ab3128]">
                  Map + Contact
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2d231b]">
                  {restaurant.phone || "Call store"}
                </p>
                <p className="mt-2 text-xs text-[#6e6257]">
                  {restaurant.address1}, {restaurant.city}, {restaurant.state}
                </p>
              </a>
            </div>
          </section>

          <LocalOrderBoard
            restaurantName={restaurant.name}
            menu={menu}
            orderPath={orderPath}
            orderingEnabled={orderingEnabled}
            variant="local-order"
          />
        </div>
      </div>
    </div>
  );
}

