"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Package } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import StatusBadge from "@/components/StatusBadge";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { api } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order, Paginated } from "@/lib/types";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    api<Paginated<Order>>(`/orders?page=${page}`)
      .then((r) => {
        setOrders((prev) => (page === 1 ? r.data : [...(prev ?? []), ...r.data]));
        setLastPage(r.last_page);
      })
      .catch(() => setOrders([]));
  }, [page]);

  if (orders === null) return <div className="grid place-items-center py-24"><Loader2 className="size-7 animate-spin text-brand-600" /></div>;

  return (
    <div className="container-x max-w-4xl py-6 sm:py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">My orders</h1>
      {orders.length === 0 ? (
        <div className="card mt-6 grid place-items-center p-12 text-center">
          <Package className="size-12 text-brand-300" />
          <p className="mt-3 font-semibold">No orders yet</p>
          <Link href="/products" className="btn-primary mt-5">Start shopping</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card overflow-hidden">
              <Link href={`/account/orders/${o.order_number}`} className="flex items-center gap-4 p-4 transition hover:bg-slate-50/60">
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((i) => (
                    <span key={i.id} className="relative size-14 overflow-hidden rounded-xl bg-slate-50 ring-2 ring-white">
                      <SafeImage src={i.image_url} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{o.items.map((i) => i.product_name).join(", ")}</p>
                  <p className="mt-0.5 text-xs text-muted">#{o.order_number} · {formatDate(o.created_at)}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <span className="text-sm font-bold">{formatPrice(o.total)}</span>
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-slate-400" />
              </Link>
              {!o.whatsapp_sent_at && o.status === "pending" && (
                <a
                  href={o.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => api(`/orders/${o.order_number}/whatsapp-sent`, { method: "POST" }).catch(() => {})}
                  className="flex items-center justify-center gap-2 border-t border-emerald-100 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700"
                >
                  <WhatsAppIcon className="size-4" /> Send this order on WhatsApp to confirm
                </a>
              )}
            </div>
          ))}
          {page < lastPage && (
            <button onClick={() => setPage((p) => p + 1)} className="btn-secondary w-full">Load more</button>
          )}
        </div>
      )}
    </div>
  );
}
