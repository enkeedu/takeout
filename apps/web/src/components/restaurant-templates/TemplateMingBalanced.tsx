import { Fira_Sans, Roboto } from "next/font/google";
import { formatPrice } from "@/lib/restaurantDemo";
import { Reveal } from "@/components/Reveal";
import { OrderPanel } from "./OrderPanel";
import { OpeningHoursPanel } from "./OpeningHoursPanel";
import { buildTemplateRootStyle } from "./preview-options";
import type { RestaurantTemplateProps } from "./types";

const display = Fira_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const body = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-body",
});

function placeholderImage(label: string, accent = "#B51F09") {
  const safeLabel = label.toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#fffefb"/>
      <stop offset="55%" stop-color="#f9f5ee"/>
      <stop offset="100%" stop-color="#f3eee6"/>
    </linearGradient>
  </defs>
  <rect width="900" height="600" fill="url(#bg)"/>
  <rect x="48" y="48" width="804" height="504" rx="28" fill="none" stroke="${accent}" stroke-opacity="0.25" stroke-width="2"/>
  <text x="450" y="300" text-anchor="middle" fill="${accent}" font-size="30" font-family="Fira Sans, Arial, sans-serif" font-weight="700" letter-spacing="4">${safeLabel}</text>
  <text x="450" y="340" text-anchor="middle" fill="#6b6b6b" font-size="14" font-family="Roboto, Arial, sans-serif" letter-spacing="3">IMAGE PLACEHOLDER</text>
</svg>`;
  const encoded = encodeURIComponent(svg);
  return `url("data:image/svg+xml;utf8,${encoded}")`;
}

export function TemplateMingBalanced({
  restaurant,
  menu,
  reviews,
  hours,
  tagline,
  highlights,
  mapsUrl,
  orderPath,
  orderingEnabled,
  fontPreset,
  palette,
}: RestaurantTemplateProps) {
  const assetBase = "/templates/ming";
  const menuItems = menu.flatMap((category) => category.items);
  const menuLeft = menuItems.slice(0, 6);
  const menuRight = menuItems.slice(6, 12);
  const menuImages = ["menu-1", "menu-2", "menu-3", "menu-4"];

  const popularItems = menuItems.filter((item) => item.popular).slice(0, 4);
  const featuredItems =
    popularItems.length >= 4
      ? popularItems
      : [...popularItems, ...menuItems.filter((item) => !item.popular)].slice(0, 4);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayLabel = dayLabels[new Date().getDay()];
  const todayHours =
    hours.rows.find((row) => row.day.startsWith(todayLabel))?.hours ||
    hours.rows[0]?.hours ||
    "Call for hours";

  const photoStyle = (baseName: string, label: string) => ({
    backgroundImage: `url(${assetBase}/${baseName}.webp), url(${assetBase}/${baseName}.jpg), url(${assetBase}/${baseName}.svg), ${placeholderImage(label)}`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  });
  const rootStyle = buildTemplateRootStyle(fontPreset, palette);

  return (
    <div
      className={`${display.variable} ${body.variable} [font-family:var(--font-body)] text-[#2D2D2D]`}
      style={rootStyle}
    >
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#FFFEFD]">
        <div className="absolute inset-0 pattern-medallion opacity-10" />
        <div className="relative mx-auto max-w-[1760px] px-6 py-10 space-y-10">
          <section className="full-bleed section-angled relative overflow-hidden border border-[#e6dfd8] text-white">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={photoStyle("hero", "Hero")}
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/20" />
            <div className="relative mx-auto max-w-[1760px] px-6 py-12 md:px-10 md:py-16">
              <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.25em] text-white/80">
                <div className="flex items-center gap-3">
                  <img
                    src={`${assetBase}/deco-top-left.webp`}
                    alt={`${restaurant.name} logo`}
                    className="h-10 w-auto"
                  />
                  <span className="hidden sm:inline">{restaurant.name}</span>
                </div>
                <nav className="hidden lg:flex items-center gap-6 text-white/80">
                  <a href="#menu" className="hover:text-white">
                    Menu
                  </a>
                  <a href="#order" className="hover:text-white">
                    Order
                  </a>
                  <a href="#contact" className="hover:text-white">
                    Contact
                  </a>
                </nav>
                <a
                  href="#menu"
                  className="hidden md:inline-flex items-center justify-center border border-white/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black"
                >
                  View Menus
                </a>
              </div>

              <div className="mt-12 text-center">
                <Reveal variant="fade-up">
                  <h1 className="text-4xl [font-family:var(--font-display)] md:text-5xl">
                    {restaurant.name}
                  </h1>
                  <p className="mx-auto mt-4 max-w-2xl text-base text-white/80">
                    {tagline}
                  </p>
                </Reveal>
                <Reveal variant="fade-up" delayMs={140}>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <a
                      href="#order"
                      className="border border-[var(--template-accent)] bg-[var(--template-accent)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[var(--template-accent-strong)] hover:text-black"
                    >
                      Order Online
                    </a>
                    <a
                      href="#menu"
                      className="border border-white/70 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black"
                    >
                      View Menu
                    </a>
                  </div>
                </Reveal>
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/70">
                  {highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="border border-white/20 px-3 py-2"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-6 text-[11px] uppercase tracking-[0.3em] text-white/70">
                <span>
                  Call {restaurant.phone ?? "(123) 123-1234"}
                </span>
                <span>Pickup ETA 20-35 min</span>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "Open Today",
                value: todayHours,
                subtitle: todayLabel,
              },
              {
                title: "Pickup + Delivery",
                value: "Order in minutes",
                subtitle: "Text updates available",
              },
              {
                title: "Find Us",
                value: `${restaurant.address1}`,
                subtitle: `${restaurant.city}, ${restaurant.state}`,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#e6dfd8] bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--template-accent)]">
                  {item.title}
                </p>
                <p className="mt-2 text-lg font-semibold text-[#010000]">
                  {item.value}
                </p>
                <p className="mt-2 text-xs text-[#6b6b6b]">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </section>

          <section
            id="about"
            className="grid items-center gap-8 lg:grid-cols-[0.55fr_0.45fr]"
          >
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-[#e6dfd8] bg-white shadow-sm">
                <div
                  className="h-[320px] bg-cover bg-center"
                  style={photoStyle("about-interior", "Interior")}
                />
              </div>
              <div className="absolute -bottom-5 left-6 border border-[var(--template-accent-strong)] bg-[var(--template-accent)] px-4 py-3 text-white shadow-lg">
                <div className="text-center text-2xl [font-family:var(--font-display)]">
                  4.8
                </div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/80">
                  Avg Rating
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--template-accent)]">
                About Us
              </p>
              <h2 className="text-3xl [font-family:var(--font-display)] text-[#010000]">
                Family recipes with a fast, friendly pickup.
              </h2>
              <p className="text-sm text-[#6b6b6b]">
                We focus on simple, honest food done right. Order online in
                minutes and enjoy fresh wok classics made to order.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--template-accent)]">
                {highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="border border-[#e6dfd8] bg-white px-3 py-2"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section
            id="order"
            className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]"
          >
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#e6dfd8] bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--template-accent)]">
                  Popular Picks
                </p>
                <h2 className="mt-2 text-3xl [font-family:var(--font-display)] text-[#010000]">
                  Crowd favorites, made fresh.
                </h2>
                <p className="mt-3 text-sm text-[#6b6b6b]">
                  Choose your spice level, add notes, and customize each dish.
                </p>
                <div className="mt-6 grid gap-4">
                  {featuredItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div
                        className="h-16 w-20 rounded-xl border border-[#e6dfd8] bg-cover bg-center"
                        style={photoStyle(
                          menuImages[index % menuImages.length],
                          item.name
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold text-[#010000]">
                            {item.name}
                          </p>
                          <span className="text-sm font-semibold text-[var(--template-accent)]">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        <p className="text-xs text-[#6b6b6b]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[#e6dfd8] bg-[#F9F8F8] p-5 text-sm text-[#2D2D2D]">
                <p className="font-semibold text-[#010000]">Order with confidence</p>
                <ul className="mt-3 space-y-2 text-xs text-[#6b6b6b]">
                  <li>Customize spice level and ingredients</li>
                  <li>Family trays and catering available</li>
                  <li>Secure checkout and clear ETA</li>
                </ul>
              </div>
            </div>

            <div>
              <OrderPanel
                restaurantName={restaurant.name}
                menu={menu}
                variant="ming-balanced"
                orderPath={orderPath}
                orderingEnabled={orderingEnabled}
              />
            </div>
          </section>

          <section
            id="menu"
            className="full-bleed section-angled relative overflow-hidden border border-[#e6dfd8] bg-[#F9F8F8] py-12"
          >
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: `url(${assetBase}/deco-bottom-right.webp)`,
                backgroundRepeat: "repeat",
                backgroundSize: "220px",
              }}
            />
            <div className="relative mx-auto max-w-[1760px] px-6">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--template-accent)]">
                  Full Menu
                </p>
                <h2 className="mt-3 text-3xl [font-family:var(--font-display)] text-[#010000] md:text-4xl">
                  Browse our authentic Chinese menu
                </h2>
              </div>
              <div className="mt-10 grid gap-8 lg:grid-cols-2">
                {[menuLeft, menuRight].map((column, columnIndex) => (
                  <div key={columnIndex} className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--template-accent)]">
                      {columnIndex === 0 ? "Popular" : "New"}
                    </h3>
                    {column.map((item, index) => (
                      <div key={item.id} className="flex gap-4">
                        <div
                          className="h-12 w-12 shrink-0 rounded-md border border-[#e6dfd8] bg-cover bg-center"
                          style={photoStyle(
                            menuImages[index % menuImages.length],
                            item.name
                          )}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-[#010000]">
                              {item.name}
                            </span>
                            <span className="flex-1 border-b border-dotted border-[#d7cfc7]" />
                            <span className="font-semibold text-[var(--template-accent)]">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          <p className="text-xs text-[#6b6b6b]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {reviews.slice(0, 3).map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-[#e6dfd8] bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[var(--template-accent)]">
                  <span>{review.name}</span>
                  <span>{review.source}</span>
                </div>
                <p className="mt-3 text-sm text-[#2D2D2D]">\"{review.quote}\"</p>
                <p className="mt-2 text-xs text-[#6b6b6b]">
                  Rated {review.rating.toFixed(1)} / 5
                </p>
              </div>
            ))}
          </section>

          <section
            id="contact"
            className="grid gap-6 lg:grid-cols-[0.45fr_0.3fr_0.25fr]"
          >
            <OpeningHoursPanel hours={hours} assetBase={assetBase} />

            <div className="rounded-2xl border border-[#e6dfd8] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#010000]">Find Us</h3>
              <p className="mt-3 text-sm text-[#6b6b6b]">
                {restaurant.address1}
                {restaurant.address2 ? `, ${restaurant.address2}` : ""}
                <br />
                {restaurant.city}, {restaurant.state} {restaurant.zip}
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--template-accent)]"
              >
                View map
              </a>
            </div>

            <div className="rounded-2xl border border-[#e6dfd8] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#010000]">Call</h3>
              <p className="mt-3 text-sm text-[#6b6b6b]">
                {restaurant.phone
                  ? `Phone: ${restaurant.phone}`
                  : "Phone available on request."}
              </p>
              <p className="mt-2 text-sm text-[#6b6b6b]">
                Catering and event menus available.
              </p>
              <button
                type="button"
                className="mt-4 w-full border border-[var(--template-accent)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--template-accent)] hover:bg-[var(--template-accent)] hover:text-white"
              >
                Send Inquiry
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
