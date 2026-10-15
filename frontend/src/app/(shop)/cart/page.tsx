"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, ready, subtotal, mrpTotal, update, remove, count } = useCart();
  const { free_shipping_above, shipping_charge } = useSettings();
  const router = useRouter();
  const shipping = free_shipping_above > 0 && subtotal >= free_shipping_above ? 0 : shipping_charge;

  if (!ready) return <div className="container-x py-20" />;

  if (items.length === 0)
    return (
      <div className="container-x grid place-items-center py-20 text-center">
        <div className="grid size-20 place-items-center rounded-full bg-brand-50"><ShoppingBag className="size-9 text-brand-500" /></div>
        <h1 className="mt-5 text-xl font-bold">Your cart is empty</h1>
        <p className="mt-1 text-sm text-muted">Add items to it now and they&apos;ll show up here.</p>
        <Link href="/products" className="btn-primary mt-6">Shop now</Link>
      </div>
    );

  return (
    <div className="container-x py-6 sm:py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">My cart <span className="text-base font-semibold text-muted">({count} items)</span></h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((i) => (
            <div key={i.product_id} className="card flex gap-4 p-3 sm:p-4">
              <Link href={`/products/${i.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:size-28">
                <SafeImage src={i.image} alt={i.name} fill sizes="112px" className="object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/products/${i.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-brand-700 sm:text-base">{i.name}</Link>
                <div className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="font-bold">{formatPrice(i.price)}</span>
                  {i.mrp && i.mrp > i.price && <span className="text-xs text-slate-400 line-through">{formatPrice(i.mrp)}</span>}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <div className="flex items-center rounded-xl ring-1 ring-slate-200">
                    <button className="grid size-8 place-items-center disabled:opacity-40" disabled={i.quantity <= 1} onClick={() => update(i.product_id, i.quantity - 1)} aria-label="Decrease"><Minus className="size-3.5" /></button>
                    <span className="w-8 text-center text-sm font-bold">{i.quantity}</span>
                    <button className="grid size-8 place-items-center disabled:opacity-40" disabled={i.quantity >= Math.min(20, i.stock)} onClick={() => update(i.product_id, i.quantity + 1)} aria-label="Increase"><Plus className="size-3.5" /></button>
                  </div>
                  <button onClick={() => remove(i.product_id)} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700">
                    <Trash2 className="size-4" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-36">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Price details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt>Price ({count} items)</dt><dd>{formatPrice(mrpTotal)}</dd></div>
            {mrpTotal > subtotal && <div className="flex justify-between text-emerald-600"><dt>Discount</dt><dd>− {formatPrice(mrpTotal - subtotal)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery charges</dt><dd>{shipping ? formatPrice(shipping) : <span className="font-semibold text-emerald-600">FREE</span>}</dd></div>
            <div className="flex justify-between border-t border-dashed border-slate-200 pt-3 text-base font-extrabold"><dt>Total amount</dt><dd>{formatPrice(subtotal + shipping)}</dd></div>
          </dl>
          {mrpTotal > subtotal && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">You will save {formatPrice(mrpTotal - subtotal)} on this order 🎉</p>}
          {shipping > 0 && free_shipping_above > 0 && (
            <p className="mt-3 text-xs text-muted">Add {formatPrice(free_shipping_above - subtotal)} more for free delivery.</p>
          )}
          <button onClick={() => router.push("/checkout")} className="btn-buy mt-5 w-full !py-3.5">Place order</button>
        </aside>
      </div>
    </div>
  );
}
