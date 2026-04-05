import { Suspense } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStateName } from "@/lib/states";
import { CORE_OWNER_PROMISE, OWNER_LAUNCH_STEPS } from "@/lib/ownerJourney";
import { SearchBar } from "@/components/SearchBar";
import { OwnerSetupExpectations } from "@/components/OwnerSetupExpectations";
import { DiscoveryProofStrip } from "@/components/discovery/DiscoveryProofStrip";
import {
  BUYER_TEMPLATE_KEYS,
  TEMPLATE_LABELS,
  TEMPLATE_PROFILES,
  type BuyerTemplateKey,
} from "@/components/restaurant-templates/types";
import type { StateInfo } from "@/lib/types";

export default async function HomePage() {
  const states = await apiFetch<StateInfo[]>("/browse/states");
  const sortedStates = [...states].sort(
    (a, b) => b.restaurant_count - a.restaurant_count
  );
  const featuredStates = sortedStates.slice(0, 6);
  const totalRestaurants = states.reduce(
    (sum, item) => sum + item.restaurant_count,
    0
  );

  const numberFormatter = new Intl.NumberFormat("en-US");
  const formatNumber = (value: number) => numberFormatter.format(value);

  const templateAccentMap: Record<BuyerTemplateKey, string> = {
    "local-order": "from-[#b73a2f] via-[#d45038] to-[#f08a56]",
    "local-storefront": "from-[#6d321f] via-[#9a4f2f] to-[#c97444]",
    "local-express": "from-[#8f3418] via-[#c65b29] to-[#f08a45]",
  };
  const templateShowcase = BUYER_TEMPLATE_KEYS.map((key) => ({
    key,
    label: TEMPLATE_LABELS[key],
    tag: TEMPLATE_PROFILES[key].badge,
    title: TEMPLATE_PROFILES[key].headline,
    detail: TEMPLATE_PROFILES[key].detail,
    fitTags: TEMPLATE_PROFILES[key].fitTags,
    href: `/ca/los-angeles/a-w-seafood-restaurant?preview=1&template=${key}`,
    cta: `Preview ${TEMPLATE_LABELS[key]}`,
    accent: templateAccentMap[key],
  }));

  return (
    <div className="space-y-8 pb-8">
      <section className="full-bleed relative overflow-hidden border-y border-[#2c1f18]/50 bg-[#130d0a] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{
            backgroundImage:
              "url('/templates/ming/hero.webp'), radial-gradient(circle at 25% 20%, rgba(255,140,102,0.45) 0, rgba(255,140,102,0) 48%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#120b09]/90 via-[#140d0a]/70 to-[#120b09]/85" />

        <div className="relative mx-auto w-full max-w-[1720px] px-4 py-10 md:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#ffb998]">
                Built for Chinese Restaurant Owners
              </p>
              <h1 className="font-[var(--font-display)] mt-3 max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl">
                {CORE_OWNER_PROMISE}
              </h1>
              <p className="mt-4 max-w-3xl text-base text-[#f5ddd2] md:text-lg">
                Start with your existing listing data, then claim, confirm, and publish a
                restaurant website with English and Chinese support.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/search"
                  data-analytics-event="discovery_search_cta_click"
                  data-analytics-payload={JSON.stringify({
                    source: "home_hero_primary",
                  })}
                  className="rounded-xl bg-[#d64534] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[#d64534]/25 transition-all hover:bg-[#b43728] active:scale-[0.99]"
                >
                  Find My Restaurant
                </Link>
                <Link
                  href="/not-listed"
                  className="rounded-xl border border-[#f8c7ae]/55 bg-white/10 px-5 py-3 text-sm font-semibold text-[#ffe1d3] transition-colors hover:bg-white/20"
                >
                  Not Listed Yet?
                </Link>
                <a
                  href="tel:+18183420990"
                  data-analytics-event="discovery_help_click"
                  data-analytics-payload={JSON.stringify({
                    source: "home_hero_secondary",
                    channel: "phone",
                  })}
                  className="rounded-xl border border-[#f8c7ae]/55 bg-white/10 px-5 py-3 text-sm font-semibold text-[#ffe1d3] transition-colors hover:bg-white/20"
                >
                  Talk to a Human
                </a>
              </div>

              <div className="mt-6 w-full max-w-2xl rounded-2xl border border-[#ffffff2e] bg-black/25 p-3">
                <Suspense>
                  <SearchBar />
                </Suspense>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#ffddca]">
                  Search by restaurant, city, ZIP, street address, or phone
                </p>
              </div>
            </div>

            <aside className="rounded-2xl border border-[#ffffff2a] bg-black/35 p-6 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#ffb998]">
                Why Owners Start Here
              </p>
              <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold leading-tight tracking-tight">
                One search, then a clear website claim path
              </h2>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-[#ffffff26] bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-[#d9bdb0]">
                    Directory Coverage
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {formatNumber(totalRestaurants)} listings
                  </p>
                </div>
                <div className="rounded-lg border border-[#ffffff26] bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-[#d9bdb0]">
                    Transparent Pricing
                  </p>
                  <p className="mt-1 font-semibold text-white">$299 setup + $99/mo</p>
                </div>
                <div className="rounded-lg border border-[#ffffff26] bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-[#d9bdb0]">
                    Website Timeline
                  </p>
                  <p className="mt-1 font-semibold text-white">5-7 days</p>
                </div>
                <div className="rounded-lg border border-[#ffffff26] bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-[#d9bdb0]">
                    Human Support
                  </p>
                  <p className="mt-1 font-semibold text-white">English | Chinese</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <DiscoveryProofStrip
        eyebrow="Verified Owner Proof"
        items={[
          { label: "Directory Coverage", value: `${formatNumber(totalRestaurants)} listings` },
          { label: "Active Markets", value: `${states.length} states` },
          { label: "Publishing Model", value: "Baseline site + owner claim" },
          { label: "Support", value: "English | Chinese | Human help" },
        ]}
      />

      <section className="rounded-3xl border border-[#ead8c6] bg-gradient-to-br from-[#fff8f1] via-[#fffdfb] to-[#faeee4] p-6 shadow-sm md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
              Find - Claim - Publish
            </p>
            <h2 className="font-[var(--font-display)] mt-1 text-3xl font-bold tracking-tight text-[#1f1f1f] md:text-[2.15rem]">
              A clearer path from listing to website
            </h2>
          </div>
          <p className="max-w-2xl text-sm text-[#685b4f]">
            The directory should help owners find the right listing quickly, trust the
            product fast, and move into claim with almost no friction.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              title: OWNER_LAUNCH_STEPS[0],
              detail: "Search by name, ZIP, address, or phone so you land on the exact location.",
            },
            {
              title: OWNER_LAUNCH_STEPS[1],
              detail: "Use the existing listing data instead of rebuilding everything from scratch.",
            },
            {
              title: OWNER_LAUNCH_STEPS[2],
              detail: "Confirm the website details, pick a template, and publish a stronger web presence.",
            },
          ].map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border border-[#e7d8cb] bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b73a2f]">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[#1f1f1f]">{step.title}</h3>
              <p className="mt-2 text-sm text-[#60554b]">{step.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href="/search"
            data-analytics-event="discovery_search_cta_click"
            data-analytics-payload={JSON.stringify({
              source: "home_steps_cta",
            })}
            className="inline-flex rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#ad3324] active:scale-[0.99]"
          >
            Find My Restaurant
          </Link>
          <a
            href="https://wa.me/18183420990"
            target="_blank"
            rel="noreferrer"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "home_steps_help",
              channel: "whatsapp",
            })}
            className="inline-flex rounded-xl border border-[#e0c9b7] bg-white px-4 py-3 text-sm font-semibold text-[#6e5a4c] transition-colors hover:bg-[#fff8f2]"
          >
            Talk to a Human
          </a>
        </div>
      </section>

      <section className="rounded-3xl border border-[#ead8c6] bg-gradient-to-br from-[#fff8f1] via-[#fffdfb] to-[#faeee4] p-5 shadow-sm md:p-7">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
              Template Showroom
            </p>
            <h2 className="font-[var(--font-display)] mt-1 text-3xl font-bold tracking-tight text-[#1f1f1f] md:text-[2.15rem]">
              Preview the website templates owners can unlock
            </h2>
          </div>
          <p className="max-w-2xl text-sm text-[#685b4f]">
            Discovery comes first. These previews stay below the listing-search path and focus on
            three clear owner-facing website choices: safest default, brand-forward storefront, or a tighter phone-first presentation.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {templateShowcase.map((template) => (
            <article
              key={template.key}
              className="group relative overflow-hidden rounded-2xl border border-[#e7d8cb] bg-white p-4 shadow-sm"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${template.accent}`}
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#2f251e]">{template.label}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.11em] ${
                    template.key === "local-order"
                      ? "bg-[#ffe8e1] text-[#ab3328]"
                      : template.key === "local-express"
                        ? "bg-[#fff1e8] text-[#a64d21]"
                        : "bg-[#f6efe7] text-[#7a5f4a]"
                  }`}
                >
                  {template.tag}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-tight text-[#1f1f1f]">
                {template.title}
              </h3>
              <p className="mt-2 text-sm text-[#60554b]">{template.detail}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {template.fitTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#eadccf] bg-[#fff8f2] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7a5f4a]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href={template.href}
                data-analytics-event="home_template_showroom_click"
                data-analytics-payload={JSON.stringify({
                  template: template.key,
                  source: "home_showroom",
                })}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#be3f2f]"
              >
                {template.cta}
                <span className="transition-transform group-hover:translate-x-0.5">{"->"}</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <OwnerSetupExpectations />

      <section className="rounded-3xl border border-[#f0d3c7] bg-gradient-to-r from-[#fff4ea] to-[#ffece7] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
          Owner Call To Action
        </p>
        <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f]">
          Ready to find your listing and publish?
        </h2>
        <p className="mt-2 text-sm text-[#666]">
          Transparent pricing, migration help, and real human support.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {featuredStates.map((item) => (
            <Link
              key={item.state}
              href={`/${item.state.toLowerCase()}`}
              className="rounded-full border border-[#e5cdbc] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#6b5747] transition-colors hover:bg-[#fff8f1]"
            >
              {getStateName(item.state)} ({formatNumber(item.restaurant_count)})
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href="/search"
            data-analytics-event="discovery_search_cta_click"
            data-analytics-payload={JSON.stringify({
              source: "home_bottom_cta",
            })}
            className="inline-flex rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#ad3324] active:scale-[0.99]"
          >
            Find My Restaurant
          </Link>
          <Link
            href="/not-listed"
            className="inline-flex rounded-xl border border-[#e0c9b7] bg-white px-4 py-3 text-sm font-semibold text-[#6e5a4c] transition-colors hover:bg-[#fff8f2]"
          >
            Restaurant Not Listed?
          </Link>
          <a
            href="tel:+18183420990"
            data-analytics-event="discovery_help_click"
            data-analytics-payload={JSON.stringify({
              source: "home_bottom_cta",
              channel: "phone",
            })}
            className="inline-flex rounded-xl border border-[#e0c9b7] bg-white px-4 py-3 text-sm font-semibold text-[#6e5a4c] transition-colors hover:bg-[#fff8f2]"
          >
            Talk to a Human
          </a>
        </div>
      </section>
    </div>
  );
}
