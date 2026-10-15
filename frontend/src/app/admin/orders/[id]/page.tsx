"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/admin/ui";
import SafeImage from "@/components/SafeImage";
import StatusBadge from "@/components/StatusBadge";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const STATUSES: { value: OrderStatus; label: string; hint: string }[] = [
  { value: "pending", label: "Pending", hint: "Waiting for WhatsApp confirmation" },
  { value: "confirmed", label: "Confirmed", hint: "Verified with the customer" },
  { value: "dispatched", label: "Dispatched", hint: "Handed over for delivery" },
  { value: "delivered", label: "Delivered", hint: "Customer received it" },
  { value: "cancelled", label: "Cancelled", hint: "Stock is returned automatically" },
];

export default function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Order>(`/admin/orders/${id}`).then((o) => {
      setOrder(o);
      setStatus(o.status);
      setNote(o.admin_note ?? "");
    });
  }, [id]);

  if (!order) return <Spinner />;

  const save = async () => {
    setBusy(true);
    try {
      const o = await api<Order>(`/admin/orders/${order.id}/status`, { method: "PATCH", body: { status, admin_note: note } });
      setOrder(o);
      toast.success(`Order marked as ${o.status}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  };

  const phone = order.customer_phone.replace(/\D/g, "");
  const chatPhone = phone.length === 10 ? `91${phone}` : phone;
  const customerMsg = encodeURIComponent(`Hi ${order.customer_name}, update on your order #${order.order_number}: it is now *${order.status.toUpperCase()}*. Thank you for shopping with us!`);

  return (
    <>
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-brand-700"><ArrowLeft className="size-4" /> Orders</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">#{order.order_number}</h1>
        <StatusBadge status={order.status} />
        {order.whatsapp_sent_at ? (
          <span className="badge bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-3.5" /> Customer opened WhatsApp {formatDate(order.whatsapp_sent_at, true)}</span>
        ) : (
          <span className="badge bg-amber-50 text-amber-700"><Clock className="size-3.5" /> WhatsApp not sent yet</span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">Placed {formatDate(order.created_at, true)}</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="card divide-y divide-slate-100">
            {order.items.map((i) => (
              <div key={i.id} className="flex gap-4 p-4">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-slate-50"><SafeImage src={i.image_url} alt="" fill sizes="64px" className="object-cover" /></span>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{i.product_name}</p>
                  <p className="text-muted">Qty {i.quantity} × {formatPrice(i.price)}</p>
                </div>
                <span className="font-bold">{formatPrice(i.line_total)}</span>
              </div>
            ))}
            <dl className="space-y-1.5 p-4 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shipping ? formatPrice(order.shipping) : "FREE"}</dd></div>
              <div className="flex justify-between text-base font-extrabold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </section>

          <section className="card p-5 text-sm">
            <h2 className="font-bold">Customer & delivery</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-semibold">{order.customer_name}</p>
                <p className="text-muted">{order.customer_phone}</p>
                {order.customer_email && <p className="text-muted">{order.customer_email}</p>}
                {order.user && <p className="mt-1 text-xs text-muted">Account: {order.user.email}</p>}
              </div>
              <div className="text-muted">
                {order.address_line}{order.landmark && `, ${order.landmark}`}<br />{order.city}, {order.state} – {order.pincode}
              </div>
            </div>
            {order.notes && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-amber-900"><b>Customer note:</b> {order.notes}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`https://wa.me/${chatPhone}?text=${customerMsg}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp !py-2"><WhatsAppIcon className="size-4" /> Message customer</a>
              <a href={`tel:${order.customer_phone}`} className="btn-secondary !py-2"><Phone className="size-4" /> Call</a>
            </div>
          </section>
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-6">
          <h2 className="font-bold">Update status</h2>
          <p className="mt-1 text-xs text-muted">Change the status after checking the order in WhatsApp.</p>
          <div className="mt-4 space-y-2">
            {STATUSES.map((s) => (
              <label key={s.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${status === s.value ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-100" : "border-slate-200 hover:border-brand-200"}`}>
                <input type="radio" name="status" className="mt-0.5 accent-brand-600" checked={status === s.value} onChange={() => setStatus(s.value)} />
                <span>
                  <span className="block text-sm font-semibold">{s.label}</span>
                  <span className="block text-xs text-muted">{s.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <label className="label mt-4" htmlFor="note">Note for customer (optional)</label>
          <textarea id="note" className="input min-h-20" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Courier: BlueDart, AWB 12345" />
          <button onClick={save} disabled={busy} className="btn-primary mt-4 w-full">{busy && <Loader2 className="size-4 animate-spin" />} Save status</button>
          <dl className="mt-5 space-y-1 text-xs text-muted">
            {order.dispatched_at && <div>Dispatched: {formatDate(order.dispatched_at, true)}</div>}
            {order.delivered_at && <div>Delivered: {formatDate(order.delivered_at, true)}</div>}
          </dl>
        </aside>
      </div>
    </>
  );
}
