import { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

export default async function HomePage() {
  return (
    <div className="space-y-8 pb-8">
      <section className="full-bleed relative overflow-hidden border-y border-[#2c1f18]/50 bg-[#120c09] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
          style={{
            backgroundImage:
              "url('/templates/ming/hero.webp'), radial-gradient(circle at 25% 20%, rgba(255,140,102,0.28) 0, rgba(255,140,102,0) 48%)",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,10,7,0.98)_0%,rgba(19,12,8,0.94)_52%,rgba(21,13,9,0.84)_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[62%] bg-[linear-gradient(180deg,rgba(18,11,8,0.96)_0%,rgba(18,11,8,0.92)_100%)]" />

        <div className="relative mx-auto w-full max-w-[1720px] px-4 py-12 md:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:items-center">
            <div className="max-w-5xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#ffb998]">
                Built for Chinese Restaurant Owners
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.92] tracking-[-0.04em] text-[#fffaf6] md:text-6xl lg:text-[4.95rem]">
                Claim your restaurant website and make a stronger first impression online.
              </h1>
              <p className="mt-5 max-w-3xl text-[1.15rem] leading-8 text-[#f0d8cb]">
                We already create restaurant pages across the directory. Find yours, confirm the
                details customers actually see, add better branding and photos, and publish a site
                that feels more like the real business.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/search"
                  data-analytics-event="discovery_search_cta_click"
                  data-analytics-payload={JSON.stringify({
                    source: "home_hero_primary",
                  })}
                  className="rounded-xl bg-[#d64534] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[#d64534]/25 transition-all hover:bg-[#b43728] active:scale-[0.99]"
                >
                  Claim My Restaurant Website
                </Link>
                <Link
                  href="/not-listed"
                  className="rounded-xl border border-[#f8c7ae]/55 bg-white/10 px-5 py-3 text-sm font-semibold text-[#ffe1d3] transition-colors hover:bg-white/20"
                >
                  Restaurant Not Listed?
                </Link>
              </div>

              <div className="mt-10 max-w-3xl">
                <p className="mb-3 text-sm font-medium text-[#f3cdb8]">
                  Start by searching for the restaurant page we already created.
                </p>
                <Suspense>
                  <SearchBar variant="hero" />
                </Suspense>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm leading-6 text-[#e5c8ba]">
                  <span>Fix hours and contact info.</span>
                  <span>Add better photos and branding.</span>
                  <span>Publish without rebuilding from zero.</span>
                </div>
              </div>
            </div>

            <aside className="hidden rounded-[32px] border border-[#f3c8b0]/30 bg-[linear-gradient(180deg,rgba(37,22,16,0.96),rgba(25,15,11,0.94))] p-5 shadow-[0_24px_70px_rgba(12,6,4,0.34)] lg:block">
              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#1c110c] shadow-[0_18px_45px_rgba(0,0,0,0.24)]">
                <div
                  className="min-h-[240px] bg-cover bg-center"
                  style={{ backgroundImage: "url('/templates/ming/hero.webp')" }}
                />
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#ffb998]">
                        Claimed Website Preview
                      </p>
                      <h2 className="mt-2 text-[1.8rem] font-bold leading-tight tracking-tight text-[#fff4ec]">
                        Golden Wok
                      </h2>
                    </div>
                    <div className="rounded-full border border-[#f0b39f]/35 bg-[#2c1b14] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#ffcfb7]">
                      Live
                    </div>
                  </div>

                  <p className="text-[1rem] leading-7 text-[#efd7cb]">
                    Modern Chinese takeout with stronger branding, clearer business details, and a
                    page that feels ready for customers.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[18px] border border-white/10 bg-[#24150f] p-4">
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#dca892]">
                        Updated Details
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#f6dfd3]">
                        <li>Mon-Sun 11:00 AM - 9:30 PM</li>
                        <li>(415) 555-0147</li>
                        <li>123 Grant Ave</li>
                      </ul>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-[#24150f] p-4">
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#dca892]">
                        Better Presence
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#f6dfd3]">
                        Better photo, cleaner identity, and a website customers trust faster.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="surface-panel rounded-3xl p-6 md:p-8">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
            What Claiming Fixes
          </p>
          <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f] md:text-[2.25rem]">
            Take control of what customers see first
          </h2>
          <p className="copy-muted mt-3 max-w-3xl text-base leading-8">
            Claiming your restaurant page gives you one place to clean up the basics, strengthen
            the presentation, and publish a website that reflects the real business.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Correct the basics",
              detail: "Fix hours, phone, address, and the business details customers rely on.",
            },
            {
              title: "Improve the presentation",
              detail: "Add logo, photos, and a cleaner visual identity that feels more credible.",
            },
            {
              title: "Publish a better website",
              detail: "Turn the page into a stronger restaurant website without rebuilding from zero.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="surface-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold tracking-tight text-[#231d18]">{item.title}</h3>
              <p className="mt-2 text-base leading-7 text-[#564b41]">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
