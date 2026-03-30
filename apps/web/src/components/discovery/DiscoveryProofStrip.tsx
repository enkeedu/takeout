type DiscoveryProofItem = {
  label: string;
  value: string;
};

type DiscoveryProofStripProps = {
  eyebrow?: string;
  items: DiscoveryProofItem[];
};

export function DiscoveryProofStrip({
  eyebrow = "Owner Proof",
  items,
}: DiscoveryProofStripProps) {
  return (
    <section className="rounded-3xl border border-[#e6d7c8] bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a4562f]">
            {eyebrow}
          </p>
          <h2 className="font-[var(--font-display)] mt-1 text-2xl font-bold tracking-tight text-[#1f1f1f] md:text-[2rem]">
            Clear pricing, fast launch, human support
          </h2>
        </div>
        <p className="text-sm text-[#695c4f]">
          Built to help owners find the right listing fast and move straight into launch.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#eadfce] bg-[#fffaf4] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a4562f]">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
