"use client";

import { useState } from "react";
import { Camera, PenLine, Star } from "lucide-react";
import ReviewCard from "./ReviewCard";
import WriteReviewModal from "./WriteReviewModal";
import type { Review } from "@/lib/types";

/** Home page customer reviews with "write a review" (photos + text) for buyers. */
export default function ReviewsSection({ initial }: { initial: Review[] }) {
  const [reviews, setReviews] = useState(initial);
  const [open, setOpen] = useState(false);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section id="reviews" className="mt-16 scroll-mt-28 bg-gradient-to-b from-white to-surface py-14">
      <div className="container-x">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-600">Loved by our customers</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Real reviews from real buyers</h2>
            {reviews.length > 0 && (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                <span className="badge bg-emerald-600 text-white">{avg.toFixed(1)} <Star className="size-3 fill-current" /></span>
                based on recent verified purchases
              </p>
            )}
          </div>
          <button onClick={() => setOpen(true)} className="btn-primary self-start sm:self-auto">
            <PenLine className="size-4" /> Write a review <Camera className="size-4 opacity-70" />
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="card mt-8 p-10 text-center">
            <p className="font-semibold">No reviews yet</p>
            <p className="mt-1 text-sm text-muted">Bought something from us? Be the first to share photos and your experience.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}
      </div>
      <WriteReviewModal open={open} onClose={() => setOpen(false)} onCreated={(r) => setReviews((prev) => [r, ...prev])} />
    </section>
  );
}
