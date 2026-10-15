"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, IndianRupee, Package, ShoppingBag, Star, Timer, Users } from "lucide-react";
import { PageHeader, Spinner } from "@/components/admin/ui";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

interface Dashboard {
  stats: Record<"orders" | "pending" | "revenue" | "products" | "low_stock" | "customers" | "reviews", number>;
  status_counts: Record<string, number>;
  recent_orders: Order[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  useEffect(() => {
    api<Dashboard>("/admin/dashboard").then(setData).catch(() => {});
  }, []);
  if (!data) return <Spinner />;
  const s = data.stats;

  const cards = [
    { label: "Total orders", value: s.orders, icon: ShoppingBag, tint: "from-brand-500 to-violet-500", href: "/admin/orders" },
    { label: "Pending orders", value: s.pending, icon: Timer, tint: "from-amber-400 to-orange-500", href: "/admin/orders?status=pending" },
    { label: "Delivered revenue", value: formatPrice(s.revenue), icon: IndianRupee, tint: "from-emerald-400 to-teal-500" },
    { label: "Products", value: s.products, icon: Package, tint: "from-sky-400 to-blue-500", href: "/admin/products" },
    { label: "Low stock (≤5)", value: s.low_stock, icon: AlertTriangle, tint: "from-rose-400 to-pink-500", href: "/admin/products" },
    { label: "Customers", value: s.customers, icon: Users, tint: "from-fuchsia-400 to-purple-500" },
    { label: "Reviews", value: s.reviews, icon: Star, tint: "from-yellow-400 to-amber-500", href: "/admin/reviews" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your store" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tint, href }) => {
          const body = (
            <div className="card flex h-full items-center gap-3 p-4 transition hover:shadow-[var(--shadow-lift)]">
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-sm`}><Icon className="size-5" /></span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-muted">{label}</p>
                <p className="truncate text-lg font-extrabold sm:text-xl">{value}</p>
              </div>
            </div>
          );
          return href ? <Link key={label} href={href}>{body}</Link> : <div key={label}>{body}</div>;
        })}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-brand-600">View all</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {data.recent_orders.length === 0 && <p className="p-6 text-center text-sm text-muted">No orders yet.</p>}
          {data.recent_orders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">#{o.order_number} · {o.customer_name}</p>
                <p className="truncate text-xs text-muted">{formatDate(o.created_at, true)} · {o.items.length} item(s)</p>
              </div>
              <span className="hidden font-bold sm:block">{formatPrice(o.total)}</span>
              <StatusBadge status={o.status} />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
