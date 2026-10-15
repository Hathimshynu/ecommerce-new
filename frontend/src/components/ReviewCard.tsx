"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import SafeImage from "./SafeImage";
import Modal from "./Modal";
import { Stars } from "./Stars";
import { formatDate, initials } from "@/lib/format";
import type { Review } from "@/lib/types";

export default function ReviewCard({ review, showProduct = true }: { review: Review; showProduct?: boolean }) {
  const [zoom, setZoom] = useState<string | null>(null);
  return (
    <article className="card flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <Stars value={review.rating} />
        <span className="text-xs text-muted">{formatDate(review.created_at)}</span>
      </div>
      {review.title && <h3 className="mt-3 font-bold">{review.title}</h3>}
      <p className="mt-2 line-clamp-5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{review.comment}</p>
      {review.image_urls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.image_urls.map((src) => (
            <button key={src} onClick={() => setZoom(src)} className="relative size-16 overflow-hidden rounded-xl ring-1 ring-slate-200">
              <SafeImage src={src} alt="Customer photo" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center gap-3 pt-4">
        <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-violet-100 text-xs font-bold text-brand-700">
          {initials(review.user?.name)}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-sm font-semibold">
            {review.user?.name ?? "Customer"} <BadgeCheck className="size-4 text-emerald-500" aria-label="Verified buyer" />
          </p>
          {showProduct && review.product && (
            <Link href={`/products/${review.product.slug}`} className="block truncate text-xs text-muted hover:text-brand-700">
              on {review.product.name}
            </Link>
          )}
        </div>
      </div>
      <Modal open={!!zoom} onClose={() => setZoom(null)} size="max-w-2xl">
        {zoom && (
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-50">
            <SafeImage src={zoom} alt="Customer photo" fill sizes="700px" className="object-contain" />
          </div>
        )}
      </Modal>
    </article>
  );
}
