"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function getContextCopy(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (pathname.startsWith("/search")) {
    return {
      title: "Need help finding the exact listing?",
      primary: "Refine Search",
      href: "#search-form",
      source: "search",
    };
  }
  if (segments.length === 0) {
    return {
      title: "Find your restaurant and get a 7-day launch plan.",
      primary: "Find My Restaurant",
      href: "/search",
      source: "home",
    };
  }
  if (segments.length === 1) {
    return {
      title: "Pick your city, then claim and launch.",
      primary: "Get My 7-Day Launch Plan",
      href: "/search",
      source: "state",
    };
  }
  return {
    title: "Claim your listing and launch direct ordering this week.",
    primary: "Find My Restaurant",
    href: "/search",
    source: "city",
  };
}

export function DiscoveryStickyCta() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segments = pathname.split("/").filter(Boolean);
  const isDiscoveryRoute =
    (pathname.startsWith("/search") || segments.length <= 2) &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/claim") &&
    !pathname.startsWith("/launch");

  if (searchParams.get("claimPreview") === "1") return null;
  if (!isDiscoveryRoute) return null;
  const copy = getContextCopy(pathname);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="sticky-rise pointer-events-auto mx-auto w-full max-w-[1080px] rounded-2xl border border-[#d8c5b1] bg-white/95 px-3 py-3 shadow-xl backdrop-blur md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1f1f1f]">{copy.title}</p>
            <p className="text-xs text-[#6f6359]">
              English | Chinese - Talk to a human: call, text, or WhatsApp
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={copy.href}
              data-analytics-event="discovery_sticky_cta_click"
              data-analytics-payload={JSON.stringify({ source: copy.source })}
              className="rounded-xl bg-[#c73f2f] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#ad3324] active:scale-[0.99]"
            >
              {copy.primary}
            </Link>
            <a
              href="tel:+18183420990"
              data-analytics-event="discovery_help_click"
              data-analytics-payload={JSON.stringify({
                source: `sticky_bar_${copy.source}`,
                channel: "phone",
              })}
              className="rounded-xl border border-[#decfbf] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#695949] transition-colors hover:bg-[#fff8f2]"
            >
              Book 15-min Setup Call
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

