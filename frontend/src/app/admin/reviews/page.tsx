"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Empty, PageHeader, Pager, Spinner } from "@/components/admin/ui";
import SafeImage from "@/components/SafeImage";
import { Stars } from "@/components/Stars";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Paginated, Review } from "@/lib/types";

export default function AdminReviewsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Paginated<Review & { user?: { email?: string } }> | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    api<Paginated<Review>>(`/admin/reviews?page=${page}`).then(setData).catch(() => {});
  }, [page]);
  useEffect(load, [load]);

  const toggle = async (r: Review) => {
    await api(`/admin/reviews/${r.id}`, { method: "PATCH", body: { is_approved: !r.is_approved } });
    toast.success(r.is_approved ? "Review hidden from store" : "Review published");
    load();
  };
  const remove = async (r: Review) => {
    if (!confirm("Delete this review permanently?")) return;
    await api(`/admin/reviews/${r.id}`, { method: "DELETE" });
    toast.success("Review deleted");
    load();
  };

  return (
    <>
      <PageHeader title="Reviews" subtitle="Customer reviews are published instantly. Hide or delete anything inappropriate." />
      {!data ? <Spinner /> : data.data.length === 0 ? <Empty text="No reviews yet." /> : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {data.data.map((r) => (
              <div key={r.id} className={`card p-4 ${r.is_approved ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Stars value={r.rating} />
                    <p className="mt-1 text-sm font-semibold">{r.user?.name}</p>
                    <p className="text-xs text-muted">{formatDate(r.created_at)} · {r.product ? <Link href={`/products/${r.product.slug}`} className="hover:text-brand-700">{r.product.name}</Link> : "Deleted product"}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggle(r)} className="grid size-9 place-items-center rounded-lg hover:bg-slate-100" title={r.is_approved ? "Hide" : "Publish"}>
                      {r.is_approved ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4" />}
                    </button>
                    {user?.role === "admin" && <button onClick={() => remove(r)} className="grid size-9 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 className="size-4" /></button>}
                  </div>
                </div>
                {r.title && <p className="mt-3 font-semibold">{r.title}</p>}
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{r.comment}</p>
                {r.image_urls.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {r.image_urls.map((src) => (
                      <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="relative size-14 overflow-hidden rounded-lg ring-1 ring-slate-200">
                        <SafeImage src={src} alt="" fill sizes="56px" className="object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pager page={data.current_page} last={data.last_page} onChange={setPage} />
        </>
      )}
    </>
  );
}
