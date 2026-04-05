import { Cormorant_Garamond, Inter } from "next/font/google";
import { TEMPLATE_LABELS, type RestaurantTemplateProps } from "./types";

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

export function TemplateVisitDetails({
  restaurant,
  hours,
  highlights,
  mapsUrl,
  previewMode,
  templateKey,
}: RestaurantTemplateProps) {
  const todayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    new Date().getDay()
  ];
  const todayHours =
    hours.rows.find((row) => row.day.startsWith(todayLabel))?.hours ||
    hours.rows[0]?.hours ||
    "Call for hours";
  const heroImage = restaurant.photo_urls?.[0] || "/templates/ming/hero.webp";
  const photoGallery = restaurant.photo_urls?.slice(0, 3) || [];
  const menuImages = restaurant.menu_image_urls?.slice(0, 2) || [];
  const description =
    restaurant.short_description ||
    "Owner-confirmed visit details, hours, and contact information are available here while structured ordering stays disabled.";

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
                style={{ backgroundImage: `url('${heroImage}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/70" />
              <div className="relative p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ffc9b6]">
                  {TEMPLATE_LABELS[templateKey]} Preview
                </p>
                {restaurant.logo_url ? (
                  <img
                    src={restaurant.logo_url}
                    alt={`${restaurant.name} logo`}
                    className="mt-4 h-12 w-12 rounded-2xl border border-[#ffffff22] bg-white/95 object-cover p-1"
                  />
                ) : null}
                <h1 className="mt-2 font-[var(--font-display)] text-5xl font-semibold leading-tight md:text-6xl">
                  {restaurant.name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-[#f3ddd3] md:text-base">
                  {description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#ffe3d6]">
                  {highlights.slice(0, 4).map((highlight) => (
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
                    href="#visit"
                    className="inline-flex items-center justify-center rounded-full bg-[#fff1ea] px-5 py-3 text-sm font-semibold text-[#9f2f27] transition-transform hover:-translate-y-0.5 hover:bg-white"
                  >
                    Visit Details
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
                      Preview mode active
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4 md:p-5">
              <div className="rounded-2xl border border-[#e1d4c5] bg-[#faf6f0] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ab3128]">
                  Template
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2d231b]">
                  {TEMPLATE_LABELS[templateKey]}
                </p>
                <p className="mt-2 text-xs text-[#6e6257]">
                  Shared details-only presentation while menu UI is disabled.
                </p>
              </div>
              <div className="rounded-xl border border-[#e1d4c5] bg-[#faf6f0] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ab3128]">
                  Open Today
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2d231b]">{todayHours}</p>
                <p className="mt-2 text-xs text-[#6e6257]">
                  Live hours stay visible even while ordering content is hidden.
                </p>
              </div>
              <div className="rounded-xl border border-[#e1d4c5] bg-[#faf6f0] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ab3128]">
                  Phone
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2d231b]">
                  {restaurant.phone || "Call store"}
                </p>
                <p className="mt-2 text-xs text-[#6e6257]">
                  Guests can still contact the restaurant directly.
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
                  Open directions
                </p>
                <p className="mt-2 text-xs text-[#6e6257]">
                  {restaurant.address1}, {restaurant.city}, {restaurant.state}
                </p>
              </a>
            </div>
          </section>

          <section
            id="visit"
            className="rounded-3xl border border-[#dacdbc] bg-white p-6 shadow-sm md:p-8"
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ab3128]">
                  Website Summary
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-3xl font-semibold text-[#2d231b] md:text-4xl">
                  Visit details stay live while ordering is disabled
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6e6257] md:text-base">
                  {description}
                </p>
              </div>
              <div className="rounded-2xl border border-[#e1d4c5] bg-[#faf6f0] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ab3128]">
                  Restaurant Details
                </p>
                <div className="mt-4 space-y-3 text-sm text-[#2d231b]">
                  <p>
                    <span className="font-semibold">Today:</span> {todayHours}
                  </p>
                  <p>
                    <span className="font-semibold">Phone:</span>{" "}
                    {restaurant.phone || "Call store"}
                  </p>
                  <p>
                    <span className="font-semibold">Address:</span> {restaurant.address1},{" "}
                    {restaurant.city}, {restaurant.state}
                  </p>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-[#9f2f27] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#87261f]"
                >
                  Open Directions
                </a>
              </div>
            </div>

            {photoGallery.length > 0 ? (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ab3128]">
                  Photo Highlights
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {photoGallery.map((photoUrl, index) => (
                    <div
                      key={`${photoUrl}-${index}`}
                      className="overflow-hidden rounded-2xl border border-[#e1d4c5] bg-[#faf6f0]"
                    >
                      <img
                        src={photoUrl}
                        alt={`${restaurant.name} photo ${index + 1}`}
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {menuImages.length > 0 ? (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ab3128]">
                  Menu Images
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {menuImages.map((imageUrl, index) => (
                    <div
                      key={`${imageUrl}-${index}`}
                      className="overflow-hidden rounded-2xl border border-[#e1d4c5] bg-[#faf6f0]"
                    >
                      <img
                        src={imageUrl}
                        alt={`${restaurant.name} menu ${index + 1}`}
                        className="h-64 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
