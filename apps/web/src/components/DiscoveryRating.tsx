"use client";

type DiscoveryRatingProps = {
  rating?: number | null;
  reviewCount?: number | null;
};

function clampRating(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, value));
}

function starFillPercent(rating: number, index: number): number {
  const fill = clampRating(rating) - index;
  if (fill <= 0) return 0;
  if (fill >= 1) return 100;
  return Math.round(fill * 100);
}

function StarTile({ fillPercent }: { fillPercent: number }) {
  return (
    <span
      className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-[6px] border border-[#f1b39c] bg-[#ffe4d8] text-[11px] leading-none text-[#c95a36]"
      style={{
        backgroundImage:
          fillPercent > 0
            ? `linear-gradient(90deg, #f36f45 0%, #f36f45 ${fillPercent}%, #ffe4d8 ${fillPercent}%, #ffe4d8 100%)`
            : undefined,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 16 16"
        className={`h-3 w-3 ${fillPercent >= 50 ? "text-white" : "text-[#d96a45]"}`}
        fill="currentColor"
      >
        <path d="M8 1.2l1.96 3.98 4.39.64-3.18 3.1.75 4.37L8 11.23l-3.92 2.06.75-4.37-3.18-3.1 4.39-.64L8 1.2z" />
      </svg>
    </span>
  );
}

export function DiscoveryRating({
  rating,
  reviewCount,
}: DiscoveryRatingProps) {
  if (rating == null || rating <= 0) return null;

  const safeRating = clampRating(rating);
  const safeReviewCount = Math.max(0, reviewCount ?? 0);
  const reviewLabel =
    safeReviewCount > 0
      ? `${safeReviewCount.toLocaleString()} Google reviews`
      : "Google rating";

  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#efd7ca] bg-[#fff8f3] px-3 py-2"
      aria-label={`${safeRating.toFixed(1)} out of 5 stars`}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <StarTile
            key={index}
            fillPercent={starFillPercent(safeRating, index)}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-[#1f1f1f]">
        {safeRating.toFixed(1)}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b5f4b]">
        {reviewLabel}
      </span>
    </div>
  );
}
