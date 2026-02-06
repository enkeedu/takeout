import { DM_Serif_Display, Sora } from "next/font/google";
import { formatPrice } from "@/lib/restaurantDemo";
import { OrderPanel } from "./OrderPanel";
import { TemplatePicker } from "./TemplatePicker";
import type { RestaurantTemplateProps } from "./types";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const body = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

export function TemplateMarket({
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
  const badges = [
    restaurant.has_online_ordering
      ? "Online ordering available"
      : "Phone orders welcome",
    restaurant.has_ai_phone ? "AI phone assistant" : "Friendly team",
    restaurant.is_claimed ? "Owner-verified listing" : "Partner-ready",
  ];

  return (
    <div
      className={`${display.variable} ${body.variable} font-[var(--font-body)]`}
    >
      {previewMode ? (
        <TemplatePicker
          basePath={basePath}
          current={templateKey}
          variant="market"
        />
      ) : null}

      <section className="relative overflow-hidden rounded-3xl border border-orange-100 bg-[radial-gradient(circle_at_top,#fff7ed,#fdecc8_45%,#ffd6c7)] px-6 py-10 md:px-10">
        <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-rose-200/40 blur-3xl" />

        <div className="relative grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-700">
                Neighborhood Chinese Kitchen
              </p>
              <h1 className="mt-3 text-4xl font-[var(--font-display)] text-slate-900 md:text-5xl">
                {restaurant.name}
              </h1>
              <p className="mt-4 max-w-lg text-lg text-slate-700">
                {tagline}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-orange-700"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#order"
                className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-500"
              >
                Start Order
              </a>
              {restaurant.phone ? (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="rounded-full border border-orange-200 bg-white/90 px-5 py-2 text-sm font-semibold text-orange-700 hover:border-orange-300"
                >
                  Call {restaurant.phone}
                </a>
              ) : (
                <span className="rounded-full border border-orange-100 bg-white/70 px-5 py-2 text-sm font-semibold text-orange-400">
                  Phone unavailable
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {highlights.map((highlight, index) => (
                <div
                  key={highlight}
                  className={`rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-slate-700 stagger-${index + 1}`}
                >
                  {highlight}
                </div>
              ))}
            </div>
          </div>

          <div id="order" className="fade-up">
            <OrderPanel
              restaurantName={restaurant.name}
              menu={menu}
              variant="market"
            />
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-700">
              Full Menu
            </p>
            <h2 className="mt-2 text-3xl font-[var(--font-display)] text-slate-900">
              Favorites, Wok Classics, and Family Combos
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {menu.map((category) => (
              <div
                key={category.name}
                className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {category.name}
                </h3>
                <div className="mt-4 space-y-4">
                  {category.items.map((item) => (
                    <div key={item.id} className="text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-800">
                          {item.name}
                        </span>
                        <span className="font-semibold text-orange-700">
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
          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Featured Specials
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              {specials.map((special) => (
                <div key={special.id}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{special.title}</span>
                    <span className="text-orange-700">{special.price}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {special.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Location & Hours
            </h3>
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
              className="mt-3 inline-block text-sm font-semibold text-orange-700 hover:text-orange-600"
            >
              View on map
            </a>
            <div className="mt-4 space-y-1 text-xs text-slate-600">
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
        </aside>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-[var(--font-display)] text-slate-900">
            Inside the Kitchen
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            From wok-fired classics to fresh sides, every dish is finished to
            order.
          </p>
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

        <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-[var(--font-display)] text-slate-900">
            What Locals Say
          </h2>
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-700"
              >
                <div className="flex items-center justify-between text-xs font-semibold uppercase text-orange-700">
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
      </section>
    </div>
  );
}
