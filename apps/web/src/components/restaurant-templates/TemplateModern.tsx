import { Bebas_Neue, Space_Grotesk } from "next/font/google";
import { formatPrice } from "@/lib/restaurantDemo";
import { OrderPanel } from "./OrderPanel";
import { TemplatePicker } from "./TemplatePicker";
import type { RestaurantTemplateProps } from "./types";

const display = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

export function TemplateModern({
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
  const signatureItems = menu.flatMap((category) => category.items).slice(0, 4);

  return (
    <div
      className={`${display.variable} ${body.variable} font-[var(--font-body)]`}
    >
      {previewMode ? (
        <TemplatePicker
          basePath={basePath}
          current={templateKey}
          variant="modern"
        />
      ) : null}

      <section className="rounded-3xl border border-emerald-100 bg-[linear-gradient(120deg,#ecfeff,#ffffff_55%,#fff7ed)] px-6 py-10 md:px-10">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">
                Order-First Experience
              </p>
              <h1 className="mt-3 text-5xl font-[var(--font-display)] uppercase tracking-wide text-slate-900 md:text-6xl">
                {restaurant.name}
              </h1>
              <p className="mt-3 max-w-xl text-lg text-slate-700">
                {tagline}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 font-semibold text-emerald-700">
                Pickup & Delivery
              </span>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 font-semibold text-emerald-700">
                Live order tracking
              </span>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 font-semibold text-emerald-700">
                Schedule ahead
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {highlights.map((highlight, index) => (
                <div
                  key={highlight}
                  className={`rounded-2xl border border-emerald-100 bg-white/80 p-4 text-sm text-slate-700 stagger-${index + 1}`}
                >
                  {highlight}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#order"
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Start an Order
              </a>
              {restaurant.phone ? (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="rounded-full border border-emerald-200 bg-white px-5 py-2 text-sm font-semibold text-emerald-700 hover:border-emerald-300"
                >
                  Call {restaurant.phone}
                </a>
              ) : null}
            </div>
          </div>

          <div id="order" className="fade-up md:sticky md:top-6">
            <OrderPanel
              restaurantName={restaurant.name}
              menu={menu}
              variant="modern"
            />
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-[var(--font-display)] uppercase tracking-wide text-slate-900">
              Signature Dishes
            </h2>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Best Sellers
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {signatureItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.name}
                  </h3>
                  <span className="font-semibold text-emerald-700">
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

        <aside className="space-y-4">
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Quick Facts
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>Average prep time: 20-30 minutes</li>
              <li>Delivery radius: 4 miles</li>
              <li>Accepts all major cards</li>
              <li>Family trays available</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Today’s Specials
            </h3>
            <div className="mt-3 space-y-3 text-sm">
              {specials.map((special) => (
                <div key={special.id}>
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{special.title}</span>
                    <span className="text-emerald-700">{special.price}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {special.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-[var(--font-display)] uppercase text-slate-900">
            Location
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
            className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-600"
          >
            Directions
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

        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-[var(--font-display)] uppercase text-slate-900">
            Guest Reviews
          </h2>
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 text-sm text-slate-700"
              >
                <div className="flex items-center justify-between text-xs font-semibold uppercase text-emerald-700">
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

      <section className="mt-12 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-[var(--font-display)] uppercase text-slate-900">
            Visual Highlights
          </h2>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Fresh & Fast
          </span>
        </div>
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
      </section>
    </div>
  );
}
