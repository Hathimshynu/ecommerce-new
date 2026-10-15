"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, PenLine } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import StatusBadge from "@/components/StatusBadge";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import WriteReviewModal from "@/components/WriteReviewModal";
import { api } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

const STEPS = [
  { key: "pending", label: "Order placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "dispatched", label: "Dispatched" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);
  const [reviewFor, setReviewFor] = useState<number | null>(null);

  const load = useCallback(() => {
    api<Order>(`/orders/${orderNumber}`).then(setOrder).catch(() => setMissing(true));
  }, [orderNumber]);
  useEffect(load, [load]);

  if (missing)
    return (
      <div className="container-x py-20 text-center">
        <p className="font-semibold">Order not found</p>
        <Link href="/account/orders" className="btn-primary mt-5">My orders</Link>
      </div>
    );
  if (!order) return <div className="grid place-items-center py-24"><Loader2 className="size-7 animate-spin text-brand-600" /></div>;

  const stepIndex = STEPS.findIndex((s) => s.key === order.status);
  const dates: Record<string, string | null> = { pending: order.created_at, dispatched: order.dispatched_at, delivered: order.delivered_at };

  return (
    <div className="container-x max-w-4xl py-6 sm:py-10">
      <nav className="text-xs text-muted"><Link href="/account/orders" className="hover:text-brand-700">My orders</Link> / #{order.order_number}</nav>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Order #{order.order_number}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-sm text-muted">Placed on {formatDate(order.created_at, true)}</p>

      {!order.whatsapp_sent_at && order.status === "pending" && (
        <div className="card mt-5 flex flex-col items-start gap-3 border-emerald-200 bg-emerald-50/60 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-emerald-900"><b>Action needed:</b> send your order details on WhatsApp so we can confirm your order.</p>
          <a
            href={order.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => api(`/orders/${order.order_number}/whatsapp-sent`, { method: "POST" }).then(load).catch(() => {})}
            className="btn-whatsapp"
          >
            <WhatsAppIcon /> Send on WhatsApp
          </a>
        </div>
      )}

      {order.status === "cancelled" ? (
        <div className="card mt-5 bg-rose-50/50 p-5 text-sm text-rose-700">This order was cancelled.{order.admin_note && <> Note: {order.admin_note}</>}</div>
      ) : (
        <div className="card mt-5 p-5 sm:p-6">
          <ol className="grid grid-cols-4">
            {STEPS.map((s, i) => {
              const done = i <= stepIndex;
              return (
                <li key={s.key} className="relative flex flex-col items-center text-center">
                  {i > 0 && <span className={`absolute right-1/2 top-4 h-1 w-full -translate-y-1/2 ${done ? "bg-emerald-500" : "bg-slate-200"}`} />}
                  <span className={`relative z-10 grid size-8 place-items-center rounded-full ${done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                    <Check className="size-4" />
                  </span>
                  <span className={`mt-2 text-[11px] font-semibold sm:text-sm ${done ? "text-ink" : "text-muted"}`}>{s.label}</span>
                  {dates[s.key] && done && <span className="text-[10px] text-muted sm:text-xs">{formatDate(dates[s.key])}</span>}
                </li>
              );
            })}
          </ol>
          {order.admin_note && <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Update from store: {order.admin_note}</p>}
        </div>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-5">
        <section className="card divide-y divide-slate-100 md:col-span-3">
          {order.items.map((i) => (
            <div key={i.id} className="flex gap-4 p-4">
              <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                <SafeImage src={i.image_url} alt={i.product_name} fill sizes="80px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold">{i.product_name}</p>
                <p className="mt-1 text-xs text-muted">Qty {i.quantity} × {formatPrice(i.price)}</p>
                <p className="mt-1 text-sm font-bold">{formatPrice(i.line_total)}</p>
                {i.product_id && order.status !== "cancelled" && (
                  <button onClick={() => setReviewFor(i.product_id)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                    <PenLine className="size-3.5" /> Rate & review
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
        <aside className="space-y-5 md:col-span-2">
          <section className="card p-5 text-sm">
            <h2 className="font-bold">Delivery address</h2>
            <p className="mt-2 font-semibold">{order.customer_name}</p>
            <p className="text-muted">
              {order.address_line}{order.landmark && `, ${order.landmark}`}, {order.city}, {order.state} – {order.pincode}
            </p>
            <p className="mt-1 text-muted">Phone: {order.customer_phone}</p>
          </section>
          <section className="card p-5 text-sm">
            <h2 className="font-bold">Price details</h2>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{order.shipping ? formatPrice(order.shipping) : "FREE"}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-extrabold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </section>
        </aside>
      </div>

      {reviewFor !== null && (
        <WriteReviewModal open productId={reviewFor} onClose={() => setReviewFor(null)} />
      )}
    </div>
  );
}
