"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import Modal from "./Modal";
import SafeImage from "./SafeImage";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { Review } from "@/lib/types";

interface Reviewable {
  product_id: number;
  product_name: string;
  image_url: string | null;
  order_number: string;
}

const LABELS = ["", "Very bad", "Bad", "Good", "Very good", "Excellent"];

export default function WriteReviewModal({
  open,
  onClose,
  onCreated,
  productId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (r: Review) => void;
  productId?: number;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<Reviewable[] | null>(null);
  const [selected, setSelected] = useState<number | null>(productId ?? null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !user) return;
    api<Reviewable[]>("/reviews/reviewable")
      .then((list) => {
        setItems(list);
        setSelected((s) => s ?? productId ?? list[0]?.product_id ?? null);
      })
      .catch(() => setItems([]));
  }, [open, user, productId]);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const reset = () => {
    setRating(0);
    setTitle("");
    setComment("");
    setFiles([]);
    setErrors({});
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return setErrors({ product_id: "Select a product to review." });
    if (!rating) return setErrors({ rating: "Please choose a star rating." });
    const fd = new FormData();
    fd.append("product_id", String(selected));
    fd.append("rating", String(rating));
    fd.append("title", title);
    fd.append("comment", comment);
    files.forEach((f) => fd.append("images[]", f));
    setBusy(true);
    try {
      const review = await api<Review>("/reviews", { body: fd });
      toast.success("Thank you! Your review is live.");
      onCreated?.(review);
      reset();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors());
        toast.error(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Rate & review">
      {!user ? (
        <div className="py-6 text-center">
          <p className="text-sm text-muted">Please login to share your experience with products you have purchased.</p>
          <Link href="/login?next=/" className="btn-primary mt-5">Login to write a review</Link>
        </div>
      ) : items === null ? (
        <div className="grid place-items-center py-10"><Loader2 className="size-6 animate-spin text-brand-600" /></div>
      ) : productId && !items.some((i) => i.product_id === productId) ? (
        <div className="py-6 text-center">
          <p className="font-semibold">You have already reviewed this product</p>
          <p className="mt-1 text-sm text-muted">Thank you for sharing your feedback!</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center">
          <p className="font-semibold">No products to review yet</p>
          <p className="mt-1 text-sm text-muted">Reviews can be written for products you have ordered. Already reviewed items don&apos;t appear here.</p>
          <Link href="/products" className="btn-primary mt-5">Start shopping</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label">Product</label>
            <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {items.map((i) => (
                <button
                  type="button"
                  key={i.product_id}
                  onClick={() => setSelected(i.product_id)}
                  className={`flex w-40 shrink-0 items-center gap-2 rounded-xl border p-2 text-left transition ${selected === i.product_id ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-slate-200 hover:border-brand-300"}`}
                >
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <SafeImage src={i.image_url} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                  <span className="line-clamp-2 text-xs font-semibold">{i.product_name}</span>
                </button>
              ))}
            </div>
            {errors.product_id && <p className="field-error">{errors.product_id}</p>}
          </div>

          <div>
            <label className="label">Your rating</label>
            <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={`${n} star`}>
                  <Star className={`size-8 transition ${(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`} />
                </button>
              ))}
              <span className="ml-2 text-sm font-semibold text-slate-600">{LABELS[hover || rating]}</span>
            </div>
            {errors.rating && <p className="field-error">{errors.rating}</p>}
          </div>

          <div>
            <label className="label" htmlFor="rv-title">Title <span className="text-muted">(optional)</span></label>
            <input id="rv-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Sum it up in a few words" />
          </div>

          <div>
            <label className="label" htmlFor="rv-comment">Your review</label>
            <textarea id="rv-comment" className="input min-h-28" required minLength={5} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you like or dislike? How was the quality?" />
            {errors.comment && <p className="field-error">{errors.comment}</p>}
          </div>

          <div>
            <label className="label">Add photos <span className="text-muted">(up to 5)</span></label>
            <div className="flex flex-wrap gap-2">
              {previews.map((src, idx) => (
                <div key={src} className="relative size-20 overflow-hidden rounded-xl ring-1 ring-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="size-full object-cover" />
                  <button type="button" onClick={() => setFiles((f) => f.filter((_, i) => i !== idx))} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-white/90 shadow" aria-label="Remove photo">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {files.length < 5 && (
                <label className="grid size-20 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-brand-400 hover:text-brand-600">
                  <ImagePlus className="size-6" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const picked = Array.from(e.target.files || []);
                      setFiles((f) => [...f, ...picked].slice(0, 5));
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
            {Object.keys(errors).some((k) => k.startsWith("images")) && <p className="field-error">Images must be JPG/PNG/WEBP under 4 MB.</p>}
          </div>

          <button className="btn-primary w-full !py-3" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} Submit review
          </button>
        </form>
      )}
    </Modal>
  );
}
