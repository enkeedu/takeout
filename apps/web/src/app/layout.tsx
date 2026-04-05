import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnalyticsClickTracker } from "@/components/AnalyticsClickTracker";
import { DiscoveryStickyCta } from "@/components/DiscoveryStickyCta";
import "./globals.css";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: {
    default: "Chinese Takeout - Find Your Listing and Claim Your Website",
    template: "%s | Chinese Takeout",
  },
  description:
    "Owner-first directory for Chinese restaurants. Find your listing, claim it, and build a stronger restaurant web presence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} site-bg min-h-screen text-gray-900 flex flex-col [font-family:var(--font-body)]`}
      >
        <Suspense>
          <div data-site-shell="header">
            <Header />
          </div>
        </Suspense>
        <main
          data-site-main="true"
          className="mx-auto w-full max-w-[1720px] flex-1 px-4 py-8 pb-24 md:px-6 lg:px-8"
        >
          {children}
        </main>
        <AnalyticsClickTracker />
        <Suspense>
          <DiscoveryStickyCta />
        </Suspense>
        <div data-site-shell="footer">
          <Footer />
        </div>
      </body>
    </html>
  );
}
