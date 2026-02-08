import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
    default: "Chinese Takeout - Find Chinese Restaurants Near You",
    template: "%s | Chinese Takeout",
  },
  description:
    "Directory of Chinese restaurants across the United States. Browse by state, city, or search by name.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} site-bg min-h-screen text-gray-900 antialiased flex flex-col [font-family:var(--font-body)]`}
      >
        <Suspense>
          <Header />
        </Suspense>
        <main className="mx-auto w-full max-w-[1720px] flex-1 px-4 py-8 md:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
