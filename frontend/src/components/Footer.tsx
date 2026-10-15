import Link from "next/link";
import { Mail, MessageCircle, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import type { Category, StoreSettings } from "@/lib/types";

export default function Footer({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">
              <ShoppingBag className="size-5" />
            </span>
            <span className="text-lg font-extrabold">{settings.store_name}</span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Curated products, honest prices and personal order confirmation on WhatsApp.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/products" className="hover:text-brand-700">All products</Link></li>
            {categories.slice(0, 5).map((c) => (
              <li key={c.id}><Link href={`/products?category=${c.slug}`} className="hover:text-brand-700">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">My account</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/login" className="hover:text-brand-700">Login / Register</Link></li>
            <li><Link href="/account/orders" className="hover:text-brand-700">My orders</Link></li>
            <li><Link href="/cart" className="hover:text-brand-700">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">Help</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {settings.whatsapp_number && (
              <li>
                <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 hover:text-brand-700">
                  <MessageCircle className="size-4" /> WhatsApp us
                </a>
              </li>
            )}
            {settings.support_email && (
              <li>
                <a href={`mailto:${settings.support_email}`} className="inline-flex items-center gap-2 hover:text-brand-700">
                  <Mail className="size-4" /> {settings.support_email}
                </a>
              </li>
            )}
            <li className="inline-flex items-center gap-2"><Truck className="size-4" /> Fast doorstep delivery</li>
            <li className="inline-flex items-center gap-2"><ShieldCheck className="size-4" /> 100% genuine products</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {settings.store_name}. All rights reserved.
      </div>
    </footer>
  );
}
