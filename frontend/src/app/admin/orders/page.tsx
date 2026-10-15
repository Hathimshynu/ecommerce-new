"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Search } from "lucide-react";
import { Empty, PageHeader, Pager, Spinner } from "@/components/admin/ui";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order, Paginated } from "@/lib/types";

const TABS = ["", "pending", "confirmed", "dispatched", "delivered", "cancelled"];

function OrdersInner() {
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Order> | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page) });
    if (status) qs.set("status", status);
    if (query) qs.set("search", query);
    api<Paginated<Order>>(`/admin/orders?${qs}`).then(setData).catch(() => {});
  }, [status, query, page]);

  return (
    <>
      <PageHeader title="Orders" subtitle="Verify each order on WhatsApp, then update its status here." />
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t || "all"}
            onClick={() => { setStatus(t); setPage(1); }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${status === t ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {t || "All"}
          </button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); setQuery(search); setPage(1); }} className="relative mt-4 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input className="input !pl-10" placeholder="Search order ID, name or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>

      <div className="mt-5">
        {!data ? <Spinner /> : data.data.length === 0 ? <Empty text="No orders found." /> : (
          <>
            {/* Desktop table */}
            <div className="card hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Total</th><th className="px-5 py-3">WhatsApp</th><th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">#{o.order_number}</Link>
                        <p className="text-xs text-muted">{formatDate(o.created_at, true)}</p>
                      </td>
                      <td className="px-5 py-3"><p className="font-medium">{o.customer_name}</p><p className="text-xs text-muted">{o.customer_phone}</p></td>
                      <td className="px-5 py-3">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                      <td className="px-5 py-3 font-bold">{formatPrice(o.total)}</td>
                      <td className="px-5 py-3">
                        {o.whatsapp_sent_at
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="size-4" /> Sent</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><Clock className="size-4" /> Not yet</span>}
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {data.data.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="card block p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">#{o.order_number}</p>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 text-sm">{o.customer_name} · {o.customer_phone}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span>{formatDate(o.created_at, true)}</span>
                    <span className="text-sm font-bold text-ink">{formatPrice(o.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
            <Pager page={data.current_page} last={data.last_page} onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}

export default function AdminOrdersPage() {
  return <Suspense fallback={<Spinner />}><OrdersInner /></Suspense>;
}
