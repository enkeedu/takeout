import { Marcellus, Nunito_Sans } from "next/font/google";
import { formatPrice } from "@/lib/restaurantDemo";
import { Parallax } from "@/components/Parallax";
import { Reveal } from "@/components/Reveal";
import { OrderPanel } from "./OrderPanel";
import type { RestaurantTemplateProps } from "./types";

const display = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const body = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

function placeholderImage(label: string, accent = "#b45309") {
  const safeLabel = label.toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#f7f2ea"/>
      <stop offset="55%" stop-color="#f3ede3"/>
      <stop offset="100%" stop-color="#efe6d9"/>
    </linearGradient>
  </defs>
  <rect width="900" height="600" fill="url(#bg)"/>
  <rect x="52" y="52" width="796" height="496" rx="28" fill="none" stroke="${accent}" stroke-opacity="0.25" stroke-width="2"/>
  <text x="450" y="300" text-anchor="middle" fill="${accent}" font-size="28" font-family="Marcellus, Georgia, serif" letter-spacing="3">${safeLabel}</text>
  <text x="450" y="340" text-anchor="middle" fill="#6b7280" font-size="14" font-family="Nunito Sans, Arial, sans-serif" letter-spacing="3">IMAGE PLACEHOLDER</text>
</svg>`;
  const encoded = encodeURIComponent(svg);
  return `url("data:image/svg+xml;utf8,${encoded}")`;
}

export function TemplateWokFire({
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
}: RestaurantTemplateProps) {
  const categoryCards = menu.slice(0, 4);
  const menuItems = menu.flatMap((category) => category.items);
  const menuLeft = menuItems.slice(0, 5);
  const menuRight = menuItems.slice(5, 10);

  const photoStyle = (label: string) => ({
    backgroundImage: placeholderImage(label),
    backgroundSize: "cover",
    backgroundPosition: "center",
  });

  return (
    <div
      className={`${display.variable} ${body.variable} font-[var(--font-body)] text-slate-900`}
    >
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#f5efe6]">
        <div className="absolute inset-0 pattern-medallion opacity-12" />
        <div className="relative mx-auto max-w-[1760px] px-6 py-10 space-y-10">
          <section className="full-bleed section-angled relative overflow-hidden rounded-[32px] border border-amber-200 bg-[#f7f2ea] px-6 py-12 md:px-10">
            <div className="absolute inset-0 pattern-medallion opacity-20" />
            <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle,rgba(180,83,9,0.12)_1px,transparent_1px)] [background-size:54px_54px]" />
            <Parallax
              strength={0.06}
              className="absolute -left-12 top-6 h-44 w-44 rounded-full bg-amber-200/40 blur-3xl"
            />
            <Parallax
              strength={0.08}
              className="absolute -right-16 bottom-0 h-60 w-60 rounded-full bg-orange-200/40 blur-3xl"
            />

        <div className="relative mx-auto max-w-[1760px] grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Reveal variant="bounce">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-700">
                Wok Fire
              </p>
              <h1 className="mt-4 text-5xl font-[var(--font-display)] text-slate-900 md:text-6xl">
                {restaurant.name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-600">
                {tagline}
              </p>
            </Reveal>

            <Reveal variant="slide-left" delayMs={120}>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">
                {highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-[10px]"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal variant="slide-right" delayMs={200}>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#order"
                  className="rounded-full bg-amber-700 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  Start Order
                </a>
                {restaurant.phone ? (
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="rounded-full border border-amber-200 bg-white px-5 py-2 text-sm font-semibold text-amber-700 hover:border-amber-300"
                  >
                    Call {restaurant.phone}
                  </a>
                ) : null}
              </div>
            </Reveal>

            <Reveal variant="fade-up" delayMs={260}>
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
                  <span>Fire Specials</span>
                  <span>Tonight</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {specials.map((special) => (
                    <div key={special.id}>
                      <p className="text-sm font-semibold text-slate-900">
                        {special.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {special.description}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-amber-700">
                        {special.price}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal variant="zoom" delayMs={140}>
            <div id="order">
              <OrderPanel
                restaurantName={restaurant.name}
                menu={menu}
                variant="wok-fire"
                orderPath={orderPath}
                orderingEnabled={orderingEnabled}
              />
            </div>
          </Reveal>
        </div>

        <div className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryCards.map((category, index) => (
            <Reveal key={category.name} variant="clip" delayMs={index * 100}>
              <div className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-85"
                  style={photoStyle(category.name)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/20 to-transparent" />
                <div className="relative flex min-h-[180px] items-end p-4">
                  <div className="w-full rounded-xl border border-amber-200 bg-white/90 p-3 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
                      {category.name}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {category.items.length} selections
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Reveal variant="slide-left">
          <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-[var(--font-display)] text-slate-900">
                Signature Menu
              </h2>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
                Curated
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {menuItems.slice(0, 6).map((item, index) => (
                <Reveal
                  key={item.id}
                  variant={index % 2 === 0 ? "slide-left" : "slide-right"}
                  delayMs={index * 60}
                >
                  <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {item.name}
                      </h3>
                      <span className="font-semibold text-amber-700">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        <aside className="space-y-4">
          <Reveal variant="fade-up">
            <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Hours</h3>
              <div className="mt-3 space-y-2 text-xs text-slate-600">
                {hours.rows.map((row) => (
                  <div key={row.day} className="flex items-center justify-between">
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
          </Reveal>
          <Reveal variant="fade-up" delayMs={140}>
            <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Find Us
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
                className="mt-3 inline-block text-sm font-semibold text-amber-700 hover:text-amber-600"
              >
                View map
              </a>
            </div>
          </Reveal>
        </aside>
          </section>

          <section className="full-bleed relative mt-12 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="pointer-events-none absolute inset-0 pattern-key" />
            <div className="relative mx-auto max-w-[1760px]">
              <Reveal variant="fade-up">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
                      Menu Highlights
                    </p>
                    <h2 className="mt-2 text-3xl font-[var(--font-display)] text-slate-900">
                      Browse our authentic Chinese menu.
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-amber-700">
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
                      Popular
                    </span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
                      New
                    </span>
                  </div>
                </div>

                <div className="relative mt-8 grid gap-6 lg:grid-cols-2">
                  <div className="absolute left-1/2 top-0 hidden h-full w-px border-l border-dotted border-amber-200 lg:block" />
                  {[menuLeft, menuRight].map((column, columnIndex) => (
                    <div key={columnIndex} className="space-y-4 lg:px-6">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">
                        {columnIndex === 0 ? "Popular Menu" : "New Menu"}
                      </h3>
                      {column.map((item) => (
                        <div key={item.id} className="space-y-1 text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-900">
                              {item.name}
                            </span>
                            <span className="flex-1 border-b border-dotted border-amber-200" />
                            <span className="font-semibold text-amber-700">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Reveal variant="slide-left">
          <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-[var(--font-display)] text-slate-900">
              Guest Notes
            </h2>
            <div className="mt-4 space-y-4">
              {reviews.map((review, index) => (
                <Reveal key={review.id} delayMs={index * 80} variant="fade-up">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-sm text-slate-700">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase text-amber-700">
                      <span>{review.name}</span>
                      <span>{review.source}</span>
                    </div>
                    <p className="mt-2">"{review.quote}"</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Rated {review.rating.toFixed(1)} / 5
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal variant="slide-right">
          <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-[var(--font-display)] text-slate-900">
              Gallery
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {gallery.map((item, index) => (
                <Reveal key={item.id} delayMs={index * 70} variant="clip">
                  <Parallax strength={0.04}>
                    <div
                      className="flex h-28 items-end rounded-2xl bg-cover bg-center p-3 text-xs font-semibold text-slate-700 shadow-sm transition-transform duration-300 hover:-translate-y-1"
                      style={photoStyle(item.label)}
                    >
                      {item.label}
                    </div>
                  </Parallax>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
          </section>
        </div>
      </div>
    </div>
  );
}
