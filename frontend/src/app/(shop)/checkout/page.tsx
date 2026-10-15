"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import SafeImage from "@/components/SafeImage";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { api, ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

const ADDRESS_KEY = "shop_last_address";
const fields = ["customer_name", "customer_phone", "customer_email", "address_line", "landmark", "city", "state", "pincode", "notes"] as const;
type Form = Record<(typeof fields)[number], string>;

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { items, ready, subtotal, clear } = useCart();
  const { free_shipping_above, shipping_charge } = useSettings();
  const router = useRouter();
  const [form, setForm] = useState<Form>(() => Object.fromEntries(fields.map((f) => [f, ""])) as Form);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);

  const shipping = free_shipping_above > 0 && subtotal >= free_shipping_above ? 0 : shipping_charge;

  // Login is required to place an order (like Flipkart)
  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/checkout");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let saved: Partial<Form> = {};
    try {
      saved = JSON.parse(localStorage.getItem(ADDRESS_KEY) || "{}");
    } catch {}
    setForm((f) => ({ ...f, customer_name: user.name, customer_phone: user.phone || "", customer_email: user.email, ...saved, notes: "" }));
  }, [user]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const res = await api<{ message: string; order: Order }>("/orders", {
        body: { ...form, items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })) },
      });
      const { notes: _notes, ...address } = form;
      void _notes;
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
      clear();
      setPlaced(res.order);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors());
        toast.error(err.message);
      } else toast.error("Could not place the order. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  if (placed) return <OrderPlaced order={placed} />;
  if (!ready || loading || !user) return <div className="grid place-items-center py-24"><Loader2 className="size-7 animate-spin text-brand-600" /></div>;
  if (items.length === 0)
    return (
      <div className="container-x py-20 text-center">
        <p className="font-semibold">Your cart is empty</p>
        <Link href="/products" className="btn-primary mt-5">Continue shopping</Link>
      </div>
    );

  const input = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={props.className}>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} className="input" value={form[k]} onChange={set(k)} {...props} />
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="container-x py-6 sm:py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">Checkout</h1>
      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5 sm:p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-bold"><MapPin className="size-5 text-brand-600" /> Delivery address</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {input("customer_name", "Full name", { required: true, autoComplete: "name" })}
            {input("customer_phone", "Mobile number", { required: true, type: "tel", inputMode: "tel", autoComplete: "tel", pattern: "[0-9+\\s-]{10,15}" })}
            {input("customer_email", "Email (optional)", { type: "email", autoComplete: "email", className: "sm:col-span-2" })}
            {input("address_line", "House no, building, street, area", { required: true, autoComplete: "street-address", className: "sm:col-span-2" })}
            {input("landmark", "Landmark (optional)", { className: "sm:col-span-2" })}
            {input("city", "City / Town", { required: true, autoComplete: "address-level2" })}
            {input("state", "State", { required: true, autoComplete: "address-level1" })}
            {input("pincode", "Pincode", { required: true, inputMode: "numeric", autoComplete: "postal-code", pattern: "[0-9]{4,10}" })}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="notes">Order notes (optional)</label>
              <textarea id="notes" className="input min-h-20" value={form.notes} onChange={set("notes")} placeholder="Size, colour or delivery instructions" />
            </div>
          </div>
          {errors.items && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{errors.items}</p>}
        </section>

        <aside className="card h-fit p-5 lg:sticky lg:top-36">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={i.product_id} className="flex gap-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                  <SafeImage src={i.image} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-2 font-semibold">{i.name}</p>
                  <p className="text-muted">Qty {i.quantity} × {formatPrice(i.price)}</p>
                </div>
                <span className="text-sm font-bold">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{shipping ? formatPrice(shipping) : <span className="font-semibold text-emerald-600">FREE</span>}</dd></div>
            <div className="flex justify-between pt-2 text-base font-extrabold"><dt>Total</dt><dd>{formatPrice(subtotal + shipping)}</dd></div>
          </dl>
          <p className="mt-4 flex gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
            <MessageCircle className="size-4 shrink-0" /> After placing the order you&apos;ll send the order details to us on WhatsApp for confirmation.
          </p>
          <button className="btn-buy mt-4 w-full !py-3.5" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} Place order · {formatPrice(subtotal + shipping)}
          </button>
        </aside>
      </form>
    </div>
  );
}

/**
 * Shown right after the order is saved. The customer must tap "Send on WhatsApp":
 * the modal cannot be dismissed until they do.
 */
function OrderPlaced({ order }: { order: Order }) {
  const [sent, setSent] = useState(false);

  const onWhatsApp = () => {
    setSent(true);
    api(`/orders/${order.order_number}/whatsapp-sent`, { method: "POST" }).catch(() => {});
  };

  return (
    <div className="container-x py-16">
      <Modal open dismissible={false}>
        <div className="text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-50">
            <CheckCircle2 className="size-12 text-emerald-500" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold">Order placed successfully!</h1>
          <p className="mt-1 text-sm text-muted">
            Order ID <span className="font-bold text-ink">{order.order_number}</span> · {formatPrice(order.total)}
          </p>

          <div className="mt-5 max-h-40 overflow-y-auto rounded-2xl bg-slate-50 p-3 text-left text-sm">
            {order.items.map((i) => (
              <div key={i.id} className="flex justify-between gap-3 py-1">
                <span className="line-clamp-1">{i.product_name} × {i.quantity}</span>
                <span className="shrink-0 font-semibold">{formatPrice(i.line_total)}</span>
              </div>
            ))}
          </div>

          {!sent ? (
            <>
              <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">
                <b>One last step (mandatory):</b> send your order details to us on WhatsApp so we can confirm and dispatch it.
              </p>
              <a href={order.whatsapp_url} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp} className="btn-whatsapp mt-4 w-full !py-4 text-base">
                <WhatsAppIcon /> Send order on WhatsApp
              </a>
            </>
          ) : (
            <>
              <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                Thanks! We&apos;ll verify your order on WhatsApp and update the status in your orders.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <a href={order.whatsapp_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">Open WhatsApp again</a>
                <Link href={`/account/orders/${order.order_number}`} className="btn-primary">View my order</Link>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
