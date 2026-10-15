import Link from "next/link";
import SafeImage from "./SafeImage";
import { RatingBadge } from "./Stars";
import QuickAdd from "./QuickAdd";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const img = product.images?.[0]?.url;
  return (
    <article className="group card relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-slate-50">
        <SafeImage
          src={img}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {product.discount_percent > 0 && (
          <span className="badge absolute left-3 top-3 bg-white/95 text-emerald-700 shadow-sm">{product.discount_percent}% off</span>
        )}
        {product.stock <= 0 && (
          <span className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-semibold text-slate-700">Out of stock</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        {product.brand && <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{product.brand}</p>}
        <Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug text-ink hover:text-brand-700">
          {product.name}
        </Link>
        <RatingBadge value={product.reviews_avg_rating} count={product.reviews_count} />
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-bold text-ink">{formatPrice(product.price)}</span>
            {product.mrp && product.mrp > product.price ? (
              <span className="text-xs text-slate-400 line-through">{formatPrice(product.mrp)}</span>
            ) : null}
          </div>
          {product.stock > 0 && <QuickAdd product={product} />}
        </div>
      </div>
    </article>
  );
}
