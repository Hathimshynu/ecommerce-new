"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Empty, PageHeader, Pager, Spinner } from "@/components/admin/ui";
import SafeImage from "@/components/SafeImage";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Paginated, Product } from "@/lib/types";

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Paginated<Product> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page: String(page) });
    if (query) qs.set("search", query);
    api<Paginated<Product>>(`/admin/products?${qs}`).then(setData).catch(() => {});
  }, [page, query]);
  useEffect(load, [load]);

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api(`/admin/products/${p.id}`, { method: "DELETE" });
      toast.success("Product deleted");
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
  };

  return (
    <>
      <PageHeader title="Products" subtitle="Add products with multiple images, details and SEO" action={<Link href="/admin/products/new" className="btn-primary"><Plus className="size-4" /> Add product</Link>} />
      <form onSubmit={(e) => { e.preventDefault(); setQuery(search); setPage(1); }} className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input className="input !pl-10" placeholder="Search name or SKU" value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>
      {!data ? <Spinner /> : data.data.length === 0 ? <Empty text="No products yet. Add your first product." /> : (
        <>
          <div className="card divide-y divide-slate-100">
            {data.data.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:size-16">
                  <SafeImage src={p.images[0]?.url} alt="" fill sizes="64px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="line-clamp-1 text-sm font-semibold hover:text-brand-700">{p.name}</Link>
                  <p className="text-xs text-muted">{p.category?.name ?? "Uncategorised"} · {p.images.length} image(s){p.sku && ` · ${p.sku}`}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-ink">{formatPrice(p.price)}</span>
                    <span className={`badge ${p.stock <= 5 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>Stock {p.stock}</span>
                    {!p.is_active && <span className="badge bg-slate-200 text-slate-600">Hidden</span>}
                    {p.is_featured && <span className="badge bg-brand-50 text-brand-700">Featured</span>}
                  </div>
                </div>
                <Link href={`/admin/products/${p.id}`} className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit"><Pencil className="size-4" /></Link>
                {user?.role === "admin" && (
                  <button onClick={() => remove(p)} className="grid size-9 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete"><Trash2 className="size-4" /></button>
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
