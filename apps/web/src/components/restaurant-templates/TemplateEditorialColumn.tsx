import { Lora, Source_Sans_3 } from "next/font/google";
import { formatPrice } from "@/lib/restaurantDemo";
import { OrderPanel } from "./OrderPanel";
import { buildTemplateRootStyle } from "./preview-options";
import type { RestaurantTemplateProps } from "./types";

const display = Lora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export function TemplateEditorialColumn({
  restaurant,
  menu,
  reviews,
  hours,
  specials,
  tagline,
  mapsUrl,
  orderPath,
  orderingEnabled,
  fontPreset,
  palette,
}: RestaurantTemplateProps) {
  const menuColumns = [menu[0], menu[1], menu[2]].filter(Boolean);
  const rootStyle = buildTemplateRootStyle(fontPreset, palette);

  return (
    <div
      className={`${display.variable} ${body.variable} [font-family:var(--font-body)] text-slate-900`}
      style={rootStyle}
    >
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#f8f6f2]">
        <div className="mx-auto max-w-[1760px] px-6 py-8 md:py-12">
          <section className="full-bleed border-y border-slate-300 bg-[#fcfbf8] py-8">
            <div className="mx-auto max-w-[1300px] px-6">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.36em] text-[var(--template-accent)]">
                Editorial Column
              </p>
              <h1 className="mt-2 text-center text-5xl leading-tight [font-family:var(--font-display)] md:text-6xl">
                {restaurant.name}
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-center text-lg text-slate-600">
                {tagline}
              </p>
              <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-4 border-y border-slate-300 py-3 text-sm text-slate-600">
                <span>
                  {restaurant.address1}
                  {restaurant.address2 ? `, ${restaurant.address2}` : ""}
                </span>
                <span className="hidden sm:inline">|</span>
                <span>
                  {restaurant.city}, {restaurant.state} {restaurant.zip}
                </span>
                {restaurant.phone ? (
                  <>
                    <span className="hidden sm:inline">|</span>
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="font-semibold text-[var(--template-accent)]"
                    >
                      {restaurant.phone}
                    </a>
                  </>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-8 lg:grid-cols-[0.36fr_0.64fr]">
            <aside className="space-y-5">
              <div className="rounded-2xl border border-slate-300 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--template-accent)]">
                  About
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Real location details, contact info, and business profile are
                  pulled directly from the restaurant record.
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-[var(--template-accent)] hover:text-[var(--template-accent-strong)]"
                >
                  View on maps
                </a>
              </div>

              <div className="rounded-2xl border border-slate-300 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--template-accent)]">
                  Opening Hours
                </p>
                <div className="mt-3 divide-y divide-slate-200">
                  {hours.rows.map((row) => (
                    <div
                      key={row.day}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="font-semibold text-slate-800">{row.day}</span>
                      <span className="text-slate-600">{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-300 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--template-accent)]">
                  Tonight's Picks
                </p>
                <div className="mt-3 space-y-3">
                  {specials.map((special) => (
                    <div key={special.id} className="border-l-2 border-slate-300 pl-3">
                      <p className="text-base [font-family:var(--font-display)]">
                        {special.title}
                      </p>
                      <p className="text-sm text-slate-600">{special.description}</p>
                      <p className="mt-1 text-xs font-semibold text-[var(--template-accent)]">
                        {special.price}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 border-b border-slate-300 pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--template-accent)]">
                  Mock Menu Preview
                </p>
                <h2 className="mt-2 text-3xl [font-family:var(--font-display)] md:text-4xl">
                  Daily Menu
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  This style intentionally uses mock menu content while keeping
                  real restaurant profile data.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {menuColumns.map((category) => (
                  <div key={category.name} className="space-y-3">
                    <h3 className="border-b border-slate-300 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--template-accent)]">
                      {category.name}
                    </h3>
                    {category.items.slice(0, 5).map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-slate-900">
                            {item.name}
                          </span>
                          <span className="flex-1 border-b border-dotted border-slate-300" />
                          <span className="font-semibold text-[var(--template-accent)]">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{item.description}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="order" className="mt-8">
            <div className="rounded-3xl border border-slate-300 bg-white p-5 md:p-6">
              <div className="mb-4 flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
                <h2 className="text-2xl [font-family:var(--font-display)]">
                  Order Section
                </h2>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Editorial Layout
                </p>
              </div>
              <OrderPanel
                restaurantName={restaurant.name}
                menu={menu}
                variant="editorial-column"
                orderPath={orderPath}
                orderingEnabled={orderingEnabled}
              />
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--template-accent)]">
              Guest Notes
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    {review.name} · {review.source}
                  </div>
                  <p className="mt-2 text-sm text-slate-700">"{review.quote}"</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
