import { Fira_Sans, Roboto } from "next/font/google";
import { formatPrice } from "@/lib/restaurantDemo";
import { Parallax } from "@/components/Parallax";
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

export function TemplateMing({
  restaurant,
  menu,
  reviews,
  gallery,
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
  const categoryCards = menu.slice(0, 4);
  const menuItems = menu.flatMap((category) => category.items);
  const menuLeft = menuItems.slice(0, 5);
  const menuRight = menuItems.slice(5, 10);

  const photoStyle = (baseName: string, label: string) => ({
    backgroundImage: `url(${assetBase}/${baseName}.webp), url(${assetBase}/${baseName}.jpg), url(${assetBase}/${baseName}.svg), ${placeholderImage(label)}`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  });

  const menuImages = ["menu-1", "menu-2", "menu-3", "menu-4"];
  const galleryImages = ["gallery-1", "gallery-2", "gallery-3"];
  const chefImages = ["chef-1", "chef-2"];

  const stats = [
    { value: "17+", label: "Years of Experience" },
    { value: "7+", label: "Branches" },
    { value: "140+", label: "Available Dishes" },
    { value: "421+", label: "Happy Customers" },
  ];
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
            <div
              className="absolute left-6 top-6 h-16 w-16 bg-contain bg-no-repeat opacity-90"
              style={photoStyle("deco-top-left", "Logo")}
            />
            <div
              className="absolute bottom-6 right-8 h-16 w-16 bg-contain bg-no-repeat opacity-90"
              style={photoStyle("deco-bottom-right", "Stamp")}
            />

            <div className="relative mx-auto max-w-[1760px] px-6 py-14 md:px-10 md:py-16">
              <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.25em] text-white/80">
                <div className="flex items-center gap-3">
                  <img
                    src={`${assetBase}/deco-top-left.webp`}
                    alt={`${restaurant.name} logo`}
                    className="h-10 w-auto"
                  />
                  <span className="hidden sm:inline">
                    {restaurant.name}
                  </span>
                </div>
                <nav className="hidden lg:flex items-center gap-6 text-white/80">
                  <a href="#about" className="hover:text-white">
                    About Us
                  </a>
                  <a href="#menu" className="hover:text-white">
                    Menu
                  </a>
                  <a href="#reserve" className="hover:text-white">
                    Reservation
                  </a>
                  <a href="#chef" className="hover:text-white">
                    Chef
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
                    Discover Exquisite Chinese Dishes at{" "}
                    <span className="text-[#F43D22]">{restaurant.name}</span>
                  </h1>
                  <p className="mx-auto mt-4 max-w-2xl text-base text-white/80">
                    {tagline}
                  </p>
                </Reveal>
                <Reveal variant="fade-up" delayMs={140}>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <a
                      href="#reserve"
                      className="border border-[var(--template-accent)] bg-[var(--template-accent)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[var(--template-accent-strong)] hover:text-black"
                    >
                      Reservation
                    </a>
                    <a
                      href="#menu"
                      className="border border-white/70 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black"
                    >
                      View Menus
                    </a>
                  </div>
                </Reveal>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-6 text-[11px] uppercase tracking-[0.3em] text-white/70">
                <span>
                  Call Us Anytime {restaurant.phone ?? "(123) 123-1234"}
                </span>
                <div className="flex items-center gap-3">
                  {["FB", "IG", "YT"].map((label) => (
                    <span
                      key={label}
                      className="flex h-8 w-8 items-center justify-center border border-white/40 text-[10px] font-semibold text-white/80"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section
            id="about"
            className="grid items-center gap-10 lg:grid-cols-[0.55fr_0.45fr]"
          >
            <Reveal variant="slide-left">
              <div className="relative">
                <div className="overflow-hidden rounded-2xl border border-[#e6dfd8] bg-white shadow-sm">
                  <div
                    className="h-[420px] bg-cover bg-center"
                    style={photoStyle("about-chef", "Chef")}
                  />
                </div>
                <div className="absolute -bottom-6 right-6 border border-[var(--template-accent-strong)] bg-[var(--template-accent)] px-6 py-4 text-white shadow-lg">
                  <div className="text-center text-3xl [font-family:var(--font-display)]">
                    4.8
                  </div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/80">
                    Client Ratings
                  </div>
                  <div className="mt-2 flex justify-center gap-1 text-[var(--template-accent-strong)]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span key={index}>★</span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal variant="slide-right">
              <div className="relative space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--template-accent)]">
                  About Us
                </p>
                <h2 className="text-3xl [font-family:var(--font-display)] text-[#010000] md:text-4xl">
                  Bringing the Rich Flavors of China to Your Table
                </h2>
                <p className="text-sm text-[#6b6b6b]">
                  {highlights.join(" • ")}
                </p>
                <ul className="space-y-2 text-sm text-[#2D2D2D]">
                  <li>Scelerisque sit natoque gravida elementum</li>
                  <li>Orci tellus proin amet aenean justo habitant</li>
                  <li>Aenean senectus inceptos rhoncus varius</li>
                  <li>In pretium laoreet dui aenean mollis tellus</li>
                </ul>
                <a
                  href="#menu"
                  className="inline-flex items-center justify-center border border-[var(--template-accent)] bg-[var(--template-accent)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[var(--template-accent-strong)] hover:text-black"
                >
                  Read More
                </a>
                <div className="pointer-events-none absolute -right-14 top-4 hidden xl:block">
                  <img
                    src={`${assetBase}/lantern.webp`}
                    alt="Lantern"
                    className="h-40 w-auto"
                  />
                </div>
              </div>
            </Reveal>
          </section>
          <section
            id="menu"
            className="full-bleed section-angled relative overflow-hidden border border-[#ece3db] bg-[#F9F8F8] py-12"
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
                  Signature Menu
                </p>
                <h2 className="mt-3 text-3xl [font-family:var(--font-display)] text-[#010000] md:text-4xl">
                  Savor the Diversity of Authentic Chinese Cuisine
                </h2>
              </div>
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {categoryCards.map((category, index) => (
                  <Reveal
                    key={category.name}
                    variant="clip"
                    delayMs={index * 120}
                  >
                    <div className="group relative overflow-hidden border border-[#d7cfc7] bg-white shadow-sm">
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-85"
                        style={photoStyle(
                          menuImages[index % menuImages.length],
                          category.name
                        )}
                      />
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="relative flex min-h-[230px] items-end p-4">
                        <div className="w-full border border-[var(--template-accent-strong)] bg-white/90 p-3 text-center">
                          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#010000]">
                            {category.name}
                          </p>
                          <p className="mt-1 text-xs text-[#6b6b6b]">
                            {category.items.length} selections
                          </p>
                        </div>
                      </div>
                      <div className="absolute inset-3 border border-[var(--template-accent-strong)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
          <section className="grid gap-8 lg:grid-cols-[0.35fr_0.65fr]">
            <Reveal variant="slide-left">
              <div className="relative">
                <div
                  className="h-[320px] rounded-2xl border border-[#e6dfd8] bg-cover bg-center shadow-sm"
                  style={photoStyle("lantern", "Lantern")}
                />
              </div>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                { title: "Beautiful Interior", image: "about-interior" },
                { title: "Delicious Food", image: "about-food" },
              ].map((item, index) => (
                <Reveal key={item.title} variant="clip" delayMs={index * 120}>
                  <div className="relative overflow-hidden rounded-2xl border border-[#e6dfd8] bg-white shadow-sm">
                    <div
                      className="h-56 bg-cover bg-center"
                      style={photoStyle(item.image, item.title)}
                    />
                    <div className="absolute -bottom-6 left-6 right-6 border border-[#e6dfd8] bg-white px-4 py-3 text-center text-sm font-semibold text-[#010000] shadow-sm">
                      {item.title}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
          <section className="full-bleed section-angled relative overflow-hidden border border-[#e6dfd8] bg-black text-white">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={photoStyle("reserve", "Reserve")}
            />
            <div className="absolute inset-0 bg-black/70" />
            <Reveal variant="fade-up">
              <div className="relative mx-auto max-w-[1760px] px-6 py-12 text-center">
                <h2 className="text-3xl [font-family:var(--font-display)] md:text-4xl">
                  Book Your Table Today and Savor Authentic Chinese Delights!
                </h2>
                <p className="mt-3 text-sm text-white/80">
                  Reserve a table or schedule pickup for special occasions and
                  family gatherings.
                </p>
                <a
                  href="#reserve"
                  className="mt-6 inline-flex items-center justify-center border border-white/70 bg-white px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black hover:bg-[var(--template-accent-strong)]"
                >
                  Book A Table
                </a>
              </div>
            </Reveal>
          </section>
          <section
            id="reserve"
            className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <Reveal variant="fade-up">
              <div className="relative overflow-hidden rounded-3xl border border-[#e6dfd8]">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={photoStyle("reserve", "Reserve")}
                />
                <div className="absolute inset-0 bg-black/65" />
                <div className="relative space-y-6 p-8 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--template-accent-strong)]">
                    Reserve
                  </p>
                  <h2 className="text-3xl [font-family:var(--font-display)]">
                    Reserve Now for a Culinary Journey Through China
                  </h2>
                  <form className="grid gap-4 text-sm sm:grid-cols-2">
                    {[
                      { type: "text", placeholder: "Name" },
                      { type: "email", placeholder: "Email" },
                      { type: "text", placeholder: "Phone Number" },
                      { type: "date", placeholder: "" },
                      { type: "time", placeholder: "" },
                      { type: "number", placeholder: "Number of Guests" },
                    ].map((field, index) => (
                      <input
                        key={`${field.placeholder}-${index}`}
                        type={field.type}
                        placeholder={field.placeholder}
                        className="border-b border-white/60 bg-transparent px-2 py-2 text-sm text-white placeholder-white/60 focus:outline-none"
                      />
                    ))}
                    <button
                      type="button"
                      className="sm:col-span-2 border border-[var(--template-accent)] bg-[var(--template-accent)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[var(--template-accent-strong)] hover:text-black"
                    >
                      Book Now
                    </button>
                  </form>
                </div>
              </div>
            </Reveal>

            <Reveal variant="zoom" delayMs={160}>
              <div id="order">
                <OrderPanel
                  restaurantName={restaurant.name}
                  menu={menu}
                  variant="ming"
                  orderPath={orderPath}
                  orderingEnabled={orderingEnabled}
                />
              </div>
            </Reveal>
          </section>
          <section
            id="contact"
            className="grid gap-6 lg:grid-cols-[0.4fr_0.3fr_0.3fr]"
          >
            <Reveal variant="slide-left">
              <OpeningHoursPanel hours={hours} assetBase={assetBase} />
            </Reveal>

            <Reveal variant="fade-up">
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
            </Reveal>

            <Reveal variant="slide-right">
              <div className="rounded-2xl border border-[#e6dfd8] bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#010000]">
                  Get In Touch
                </h3>
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
            </Reveal>
          </section>
          <section className="full-bleed section-angled relative overflow-hidden border border-[#e6dfd8] bg-[#F9F8F8] py-12">
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
                  Menu List
                </p>
                <h2 className="mt-3 text-3xl [font-family:var(--font-display)] text-[#010000] md:text-4xl">
                  Browse Our Authentic Chinese Menu
                </h2>
              </div>
              <div className="mt-10 grid gap-10 lg:grid-cols-2">
                {[menuLeft, menuRight].map((column, columnIndex) => (
                  <div key={columnIndex} className="space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--template-accent)]">
                      {columnIndex === 0 ? "Popular Menu" : "New Menu"}
                    </h3>
                    {column.map((item, index) => (
                      <div key={item.id} className="flex gap-4">
                        <div
                          className="h-14 w-14 shrink-0 rounded-md border border-[#e6dfd8] bg-cover bg-center"
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
          <section
            id="chef"
            className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <Reveal variant="slide-left">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--template-accent)]">
                  Our Chefs
                </p>
                <h2 className="text-3xl [font-family:var(--font-display)] text-[#010000] md:text-4xl">
                  Meet the Master Behind Our Authentic Chinese Creations
                </h2>
                <p className="text-sm text-[#6b6b6b]">
                  Generational recipes, fresh ingredients, and a passion for
                  welcoming every guest.
                </p>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center border border-[var(--template-accent)] bg-[var(--template-accent)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[var(--template-accent-strong)] hover:text-black"
                >
                  View more Chef
                </a>
              </div>
            </Reveal>

            <div className="grid gap-6 sm:grid-cols-2">
              {chefImages.map((image, index) => (
                <Reveal key={image} variant="fade-up" delayMs={index * 120}>
                  <div className="overflow-hidden border border-[#e6dfd8] bg-white shadow-sm">
                    <div
                      className="h-48 bg-cover bg-center"
                      style={photoStyle(image, "Chef")}
                    />
                    <div className="p-4 text-center">
                      <h3 className="text-lg font-semibold text-[#010000]">
                        {index === 0 ? "John Doe" : "Joe Bloggs"}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--template-accent)]">
                        {index === 0
                          ? "Proprietor, Head Chef"
                          : "Head Chef"}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
          <section className="full-bleed section-angled relative overflow-hidden border border-[var(--template-accent)] bg-[var(--template-accent)] text-white">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url(${assetBase}/deco-bottom-right.webp)`,
                backgroundRepeat: "repeat",
                backgroundSize: "200px",
              }}
            />
            <div className="relative mx-auto max-w-[1760px] px-6 py-10">
              <div className="grid gap-4 md:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-[var(--template-accent-strong)] px-4 py-6 text-center"
                  >
                    <div className="text-3xl [font-family:var(--font-display)]">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-xs uppercase tracking-[0.2em] text-white/80">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="relative">
            <Reveal variant="fade-up">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--template-accent)]">
                  Latest Stories
                </p>
                <h2 className="mt-3 text-3xl [font-family:var(--font-display)] text-[#010000] md:text-4xl">
                  Relive The Stories and Flavors From Our Blog
                </h2>
              </div>
            </Reveal>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {galleryImages.map((image, index) => (
                <Reveal key={image} variant="clip" delayMs={index * 120}>
                  <div className="border border-[#e6dfd8] bg-white shadow-sm">
                    <div
                      className="h-44 bg-cover bg-center"
                      style={photoStyle(image, "Blog")}
                    />
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-[var(--template-accent)]">
                        {index === 0
                          ? "How to Make Perfect Dumplings at Home"
                          : index === 1
                          ? "The Journey of Noodles in Chinese Culture"
                          : "A Guide to Pairing Chinese Food with Tea"}
                      </h3>
                      <p className="mt-2 text-xs text-[#6b6b6b]">
                        Chef stories, recipes, and rituals that bring the
                        dining experience to life.
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Reveal variant="slide-left">
              <div className="border border-[#e6dfd8] bg-white p-6 shadow-sm">
                <h2 className="text-2xl [font-family:var(--font-display)] text-[#010000]">
                  Guest Book
                </h2>
                <div className="mt-4 space-y-4">
                  {reviews.map((review, index) => (
                    <Reveal key={review.id} delayMs={index * 80} variant="fade-up">
                      <div className="border border-[#e6dfd8] bg-[#F9F8F8] p-4 text-sm text-[#2D2D2D]">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase text-[var(--template-accent)]">
                          <span>{review.name}</span>
                          <span>{review.source}</span>
                        </div>
                        <p className="mt-2">"{review.quote}"</p>
                        <p className="mt-2 text-xs text-[#6b6b6b]">
                          Rated {review.rating.toFixed(1)} / 5
                        </p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal variant="slide-right">
              <div className="border border-[#e6dfd8] bg-white p-6 shadow-sm">
                <h2 className="text-2xl [font-family:var(--font-display)] text-[#010000]">
                  Gallery
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {gallery.map((item, index) => (
                    <Reveal key={item.id} delayMs={index * 70} variant="clip">
                      <Parallax strength={0.04}>
                        <div
                          className="flex h-28 items-end border border-[#e6dfd8] bg-cover bg-center p-3 text-xs font-semibold text-[#2D2D2D]"
                          style={photoStyle(
                            galleryImages[index % galleryImages.length],
                            item.label
                          )}
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
