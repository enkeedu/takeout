import { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

export default async function HomePage() {
  return (
    <div className="pb-8">
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
                Claim your restaurant page and get your business online.
              </h1>
              <p className="mt-5 max-w-3xl text-[1.15rem] leading-8 text-[#f0d8cb]">
                Whether you need a first website, cleaner business details, better visibility, or a
                page you actually control, start with the restaurant page we already created and
                publish something customers can trust.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {[
                  "No website yet",
                  "Wrong info online",
                  "Need a better page",
                  "Want more control",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#f3c7af]/30 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#ffd8c6]"
                  >
                    {item}
                  </span>
                ))}
              </div>

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
                  <span>Publish a first website fast.</span>
                  <span>Fix hours, phone, and address.</span>
                  <span>Improve it over time.</span>
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
                    Start simple with a page that is live, accurate, and ready for customers. Add
                    stronger branding and upgrades later.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[18px] border border-white/10 bg-[#24150f] p-4">
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#dca892]">
                        Start With Basics
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#f6dfd3]">
                        <li>Mon-Sun 11:00 AM - 9:30 PM</li>
                        <li>(415) 555-0147</li>
                        <li>123 Grant Ave</li>
                      </ul>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-[#24150f] p-4">
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#dca892]">
                        Improve Later
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#f6dfd3]">
                        Add better photos, cleaner branding, and a stronger presence when you are
                        ready.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
