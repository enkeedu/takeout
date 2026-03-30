export default function LaunchStatusLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-3">
          <div className="h-3 w-28 animate-pulse rounded-full bg-[#efe2d6]" />
          <div className="h-10 w-72 animate-pulse rounded-full bg-[#f4e7dc]" />
          <div className="h-4 w-full max-w-3xl animate-pulse rounded-full bg-[#f7ede4]" />
          <div className="h-4 w-56 animate-pulse rounded-full bg-[#f7ede4]" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-3">
            <div className="h-3 w-32 animate-pulse rounded-full bg-[#efe2d6]" />
            <div className="h-8 w-64 animate-pulse rounded-full bg-[#f4e7dc]" />
          </div>
          <div className="mt-6 space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#eadccf] bg-[#fffaf5] p-4"
              >
                <div className="h-3 w-20 animate-pulse rounded-full bg-[#efe2d6]" />
                <div className="mt-3 h-6 w-48 animate-pulse rounded-full bg-[#f4e7dc]" />
                <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-[#f7ede4]" />
                <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-[#f7ede4]" />
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          {[0, 1, 2].map((item) => (
            <section
              key={item}
              className="rounded-3xl border border-[#e6d6c6] bg-white p-5 shadow-sm"
            >
              <div className="h-3 w-24 animate-pulse rounded-full bg-[#efe2d6]" />
              <div className="mt-4 h-4 w-40 animate-pulse rounded-full bg-[#f4e7dc]" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded-full bg-[#f7ede4]" />
            </section>
          ))}
        </aside>
      </div>
    </div>
  );
}
