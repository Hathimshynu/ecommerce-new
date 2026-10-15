import { Star } from "lucide-react";

export function RatingBadge({ value, count }: { value?: number | string | null; count?: number }) {
  const v = Number(value || 0);
  if (!v) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className="badge bg-emerald-600 text-white">
        {v.toFixed(1)} <Star className="size-3 fill-current" />
      </span>
      {count ? <span>({count})</span> : null}
    </span>
  );
}

export function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
      ))}
    </span>
  );
}
