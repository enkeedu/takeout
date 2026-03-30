type DiscoveryRouteSkeletonProps = {
  label: string;
  cardCount?: number;
};

export function DiscoveryRouteSkeleton({
  label,
  cardCount = 6,
}: DiscoveryRouteSkeletonProps) {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="rounded-3xl border border-[#deccb8] bg-gradient-to-br from-[#fff8f1] via-[#fffdfb] to-[#f9efe4] p-6 shadow-sm md:p-8">
        <div className="h-3 w-32 rounded-full bg-[#ead4c1]" />
        <div className="mt-4 h-10 max-w-2xl rounded-2xl bg-[#ebd9c8]" />
        <div className="mt-3 h-4 max-w-3xl rounded-full bg-[#f1e5d8]" />
        <div className="mt-2 h-4 max-w-2xl rounded-full bg-[#f1e5d8]" />
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`${label}-stat-${index}`}
              className="rounded-2xl border border-[#eadfce] bg-white p-4"
            >
              <div className="h-3 w-20 rounded-full bg-[#ead4c1]" />
              <div className="mt-3 h-5 w-28 rounded-full bg-[#f1e5d8]" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#e5d7c7] bg-white p-5 shadow-sm">
        <div className="h-3 w-24 rounded-full bg-[#ead4c1]" />
        <div className="mt-3 h-6 w-60 rounded-full bg-[#ebd9c8]" />
        <div className="mt-3 h-4 w-full rounded-full bg-[#f1e5d8]" />
        <div className="mt-2 h-4 w-3/4 rounded-full bg-[#f1e5d8]" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, index) => (
          <article
            key={`${label}-card-${index}`}
            className="rounded-[26px] border border-[#e8ddd2] bg-white p-5 shadow-sm"
          >
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-[#f1e5d8]" />
              <div className="h-6 w-24 rounded-full bg-[#f1e5d8]" />
            </div>
            <div className="mt-4 h-8 w-3/4 rounded-full bg-[#ebd9c8]" />
            <div className="mt-3 h-4 w-1/2 rounded-full bg-[#f1e5d8]" />
            <div className="mt-2 h-4 w-2/3 rounded-full bg-[#f1e5d8]" />
            <div className="mt-8 h-10 w-full rounded-xl bg-[#ebd9c8]" />
          </article>
        ))}
      </section>
    </div>
  );
}
