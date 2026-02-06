import Link from "next/link";
import { SearchBar } from "./SearchBar";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="shrink-0 text-xl font-bold text-red-600">
          Chinese Takeout
        </Link>
        <div className="hidden w-full max-w-md sm:block">
          <SearchBar compact />
        </div>
      </div>
    </header>
  );
}
