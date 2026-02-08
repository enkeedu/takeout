import type { HoursData } from "@/lib/restaurantDemo";

type OpeningHoursPanelProps = {
  hours: HoursData;
  assetBase: string;
  title?: string;
  className?: string;
};

export function OpeningHoursPanel({
  hours,
  assetBase,
  title = "Opening Hours",
  className = "",
}: OpeningHoursPanelProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[var(--template-hours-border)] p-6 text-white shadow-sm ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(135deg,var(--template-hours-from),var(--template-hours-via),var(--template-hours-to))",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/12" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: `url(${assetBase}/deco-bottom-right.webp)`,
          backgroundRepeat: "repeat",
          backgroundSize: "220px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-black/12" />
      <div className="relative">
        <h3 className="text-lg font-semibold uppercase tracking-[0.18em] text-white">
          {title}
        </h3>
        <div className="mt-4 space-y-1.5 text-sm">
          {hours.rows.map((row) => (
            <div
              key={row.day}
              className="grid grid-cols-[50px_1fr] items-center gap-4 border-b border-white/18 pb-2 leading-5 last:border-b-0 last:pb-0"
            >
              <span className="font-semibold text-white/95">{row.day}</span>
              <span className="text-right font-medium text-white">{row.hours}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
