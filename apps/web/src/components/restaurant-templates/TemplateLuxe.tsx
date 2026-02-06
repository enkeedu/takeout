import { Manrope, Playfair_Display } from "next/font/google";
import { formatPrice } from "@/lib/restaurantDemo";
import { OrderPanel } from "./OrderPanel";
import { TemplatePicker } from "./TemplatePicker";
import type { RestaurantTemplateProps } from "./types";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

export function TemplateLuxe({
  restaurant,
  menu,
  reviews,
  gallery,
  hours,
  specials,
  tagline,
  highlights,
  mapsUrl,
  previewMode,
  basePath,
  templateKey,
}: RestaurantTemplateProps) {
  return (
    <div
      className={`${display.variable} ${body.variable} font-[var(--font-body)]`}
    >
      {previewMode ? (
        <TemplatePicker
          basePath={basePath}
          current={templateKey}
          variant="luxe"
        />
      ) : null}

      <section className="relative overflow-hidden rounded-3xl border border-amber-100 bg-[linear-gradient(160deg,#fffdf7,#f7efe1_65%,#fdf2e2)] px-6 py-10 md:px-10">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="relative grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
                Chef Curated
              </p>
              <h1 className="mt-3 text-4xl font-[var(--font-display)] text-slate-900 md:text-5xl">
                {restaurant.name}
              </h1>
              <p className="mt-4 max-w-lg text-lg text-slate-700">
                {tagline}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((highlight, index) => (
                <div
                  key={highlight}
                  className={`rounded-2xl border border-amber-100 bg-white/70 p-4 text-sm text-slate-700 stagger-${index + 1}`}
                >
                  {highlight}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#order"
                className="rounded-full bg-[#b8893b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#a47730]"
              >
                Order Now
              </a>
              {restaurant.website_url ? (
                <a
                  href={restaurant.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-amber-200 bg-white px-5 py-2 text-sm font-semibold text-amber-700 hover:border-amber-300"
                >
                  Visit Website
                </a>
              ) : null}
            </div>

            <div className="rounded-2xl border border-amber-100 bg-white/80 p-5 text-sm text-slate-700">
              <h3 className="text-lg font-semibold text-slate-900">
                Chef's Notes
              </h3>
              <p className="mt-2">
                Classic flavors with a refined touch. Each dish is wok-fired
                and finished to order in {restaurant.city}.
              </p>
            </div>
          </div>

          <div id="order" className="fade-up">
            <OrderPanel
              restaurantName={restaurant.name}
              menu={menu}
              variant="luxe"
            />
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-[var(--font-display)] text-slate-900">
              Signature Menu
            </h2>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
              Curated
            </span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {menu.map((category) => (
              <div key={category.name} className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800">
                  {category.name}
                </h3>
                <div className="space-y-3 text-sm text-slate-600">
                  {category.items.map((item) => (
                    <div key={item.id}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
                          {item.name}
                        </span>
                        <span className="text-amber-700">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Seasonal Specials
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              {specials.map((special) => (
                <div key={special.id}>
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{special.title}</span>
                    <span className="text-amber-700">{special.price}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {special.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Reservations & Pickup
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Pre-order for gatherings and special events.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                Catering trays
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                Private dining
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                Scheduled pickup
              </span>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-[var(--font-display)] text-slate-900">
            Guest Book
          </h2>
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 text-sm text-slate-700"
              >
                <div className="flex items-center justify-between text-xs font-semibold uppercase text-amber-700">
                  <span>{review.name}</span>
                  <span>{review.source}</span>
                </div>
                <p className="mt-2">"{review.quote}"</p>
                <p className="mt-2 text-xs text-slate-500">
                  Rated {review.rating.toFixed(1)} / 5
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-[var(--font-display)] text-slate-900">
            Gallery
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {gallery.map((item) => (
              <div
                key={item.id}
                className={`flex h-28 items-end rounded-2xl p-3 text-xs font-semibold text-slate-700 ${item.themeClass}`}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-[var(--font-display)] text-slate-900">
              Visit Us
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              {restaurant.address1}
              {restaurant.address2 ? `, ${restaurant.address2}` : ""}
              <br />
              {restaurant.city}, {restaurant.state} {restaurant.zip}
            </p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-amber-700 hover:text-amber-600"
            >
              Open in Maps
            </a>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
              Hours
            </h3>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              {hours.rows.map((row) => (
                <div
                  key={row.day}
                  className="flex items-center justify-between"
                >
                  <span className="font-semibold">{row.day}</span>
                  <span>{row.hours}</span>
                </div>
              ))}
              {hours.isSample ? (
                <p className="pt-2 text-[11px] text-slate-400">
                  Sample hours shown for demo purposes.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
