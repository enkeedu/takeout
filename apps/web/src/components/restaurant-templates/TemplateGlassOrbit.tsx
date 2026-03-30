import { Manrope, Sora } from "next/font/google";
import { formatPrice } from "@/lib/restaurantDemo";
import { OrderPanel } from "./OrderPanel";
import { buildTemplateRootStyle } from "./preview-options";
import type { RestaurantTemplateProps } from "./types";

const display = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export function TemplateGlassOrbit({
  restaurant,
  menu,
  reviews,
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
  const rootStyle = buildTemplateRootStyle(fontPreset, palette);
  const menuItems = menu.flatMap((category) => category.items);
  const featured = menuItems.slice(0, 6);
  const categoryPreview = menu.slice(0, 3);
  const ratingValue = restaurant.rating ? restaurant.rating.toFixed(1) : "4.8";
  const reviewCount = restaurant.user_rating_count
    ? `${restaurant.user_rating_count.toLocaleString()} reviews`
    : "New profile";

  return (
    <div
      className={`${display.variable} ${body.variable} [font-family:var(--font-body)] text-slate-900`}
      style={rootStyle}
    >
      <div className="relative left-1/2 right-1/2 -mx-[50vw] min-h-screen w-screen overflow-hidden bg-[#eef4fb]">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-indigo-200/50 blur-3xl" />
        <div className="pointer-events-none absolute bottom-8 left-1/3 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />

        <div className="relative mx-auto max-w-[1760px] px-6 py-8 md:py-12">
          <section className="full-bleed rounded-[32px] border border-white/70 bg-white/45 p-6 shadow-[0_12px_38px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="space-y-6">
                <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[var(--template-accent)]">
                  Glass Orbit
                </p>
                <h1 className="max-w-3xl text-4xl leading-tight [font-family:var(--font-display)] md:text-6xl">
                  {restaurant.name}
                </h1>
                <p className="max-w-2xl text-base text-slate-700 md:text-lg">
                  {tagline}
                </p>

                <div className="flex flex-wrap gap-2">
                  {highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/80 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Rating
                    </p>
                    <p className="mt-2 text-2xl [font-family:var(--font-display)]">
                      {ratingValue}
                    </p>
                    <p className="text-xs text-slate-600">{reviewCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Location
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {restaurant.city}, {restaurant.state}
                    </p>
                    <p className="text-xs text-slate-600">{restaurant.zip}</p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Contact
                    </p>
                    {restaurant.phone ? (
                      <a
                        href={`tel:${restaurant.phone}`}
                        className="mt-2 block text-sm font-semibold text-[var(--template-accent)] hover:text-[var(--template-accent-strong)]"
                      >
                        {restaurant.phone}
                      </a>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Online only</p>
                    )}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 hover:text-[var(--template-accent)]"
                    >
                      View map
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/65 p-5 shadow-sm backdrop-blur-lg md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--template-accent)]">
                    Chef Orbit
                  </p>
                  <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Preview
                  </span>
                </div>
                <div className="space-y-3">
                  {specials.map((special) => (
                    <div
                      key={special.id}
                      className="rounded-2xl border border-white/75 bg-white/80 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm [font-family:var(--font-display)] text-slate-900">
                          {special.title}
                        </p>
                        <span className="text-sm font-semibold text-[var(--template-accent)]">
                          {special.price}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {special.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="#order"
                    className="rounded-full bg-[var(--template-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--template-accent-strong)] hover:text-slate-900"
                  >
                    Start order
                  </a>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-300 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[var(--template-accent)] hover:text-[var(--template-accent)]"
                  >
                    Directions
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/70 bg-white/55 p-6 shadow-sm backdrop-blur-xl">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--template-accent)]">
                      Mock Menu
                    </p>
                    <h2 className="mt-1 text-3xl [font-family:var(--font-display)]">
                      Orbit Picks
                    </h2>
                  </div>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Demo items
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {featured.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/80 bg-white/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {item.name}
                        </h3>
                        <span className="text-sm font-semibold text-[var(--template-accent)]">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {categoryPreview.map((category) => (
                  <div
                    key={category.name}
                    className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-lg"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--template-accent)]">
                      {category.name}
                    </p>
                    <div className="mt-3 space-y-2">
                      {category.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="text-xs text-slate-700">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-slate-500">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside id="order" className="space-y-6">
              <div className="rounded-3xl border border-white/70 bg-white/60 p-4 shadow-sm backdrop-blur-xl md:p-5">
                <OrderPanel
                  restaurantName={restaurant.name}
                  menu={menu}
                  variant="glass-orbit"
                  orderPath={orderPath}
                  orderingEnabled={orderingEnabled}
                />
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--template-accent)]">
                  Opening Hours
                </p>
                <div className="mt-3 space-y-2">
                  {hours.rows.map((row) => (
                    <div
                      key={row.day}
                      className="flex items-center justify-between border-b border-slate-200 pb-2 text-sm last:border-b-0 last:pb-0"
                    >
                      <span className="font-semibold text-slate-800">{row.day}</span>
                      <span className="text-slate-600">{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>

          <section className="mt-8 rounded-3xl border border-white/70 bg-white/55 p-6 shadow-sm backdrop-blur-xl">
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="text-2xl [font-family:var(--font-display)]">
                Recent Guest Notes
              </h2>
              <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Community
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-white/80 bg-white/80 p-4"
                >
                  <div className="text-xs uppercase tracking-[0.12em] text-slate-500">
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
