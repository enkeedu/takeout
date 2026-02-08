import Link from "next/link";
import { SearchBar } from "./SearchBar";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#dfd5c8] bg-[#fff9f3]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1720px] items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <p className="font-[var(--font-display)] text-2xl font-bold text-[#d0342c]">
            Chinese Takeout
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8b7965]">
            Owner Growth Platform
          </p>
        </Link>
        <div className="hidden w-full max-w-md sm:block md:max-w-lg">
          <SearchBar compact />
        </div>
      </div>
    </header>
  );
}
