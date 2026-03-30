import Link from "next/link";

export default function RestaurantNotFound() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
          Listing Recovery
        </p>
        <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
          Listing not found
        </h1>
        <p className="mt-2 text-sm text-[#665b52]">
          This restaurant slug is invalid or unavailable. Find your listing again to continue.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/search?claim=1"
            className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324]"
          >
            Find My Restaurant
          </Link>
          <a
            href="tel:+18183420990"
            className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
          >
            Call Support
          </a>
          <a
            href="https://wa.me/18183420990"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
          >
            WhatsApp Support
          </a>
        </div>
      </section>
    </div>
  );
}
