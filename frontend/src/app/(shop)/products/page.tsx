import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";
import { getCategories, getProducts } from "@/lib/api";

type SP = Promise<{ [key: string]: string | string[] | undefined }>;

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const search = str(sp.search);
  const categorySlug = str(sp.category);
  const category = categorySlug ? (await getCategories()).find((c) => c.slug === categorySlug) : undefined;
  const title = search ? `Search results for “${search}”` : category ? `Buy ${category.name} Online` : "Shop All Products";
  return {
    title,
    description: category
      ? `Shop the latest ${category.name} at the best prices. Genuine products with fast delivery.`
      : "Browse our full catalogue of genuine products at the best prices with fast delivery.",
    alternates: { canonical: category ? `/products?category=${category.slug}` : "/products" },
    robots: search ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const search = str(sp.search);
  const category = str(sp.category);
  const sort = str(sp.sort);
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (category) qs.set("category", category);
  if (sort) qs.set("sort", sort);
  qs.set("page", String(page));
  qs.set("per_page", "12");

  const [categories, result] = await Promise.all([getCategories(), getProducts(qs.toString())]);
  const current = categories.find((c) => c.slug === category);

  const link = (overrides: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { search, category, sort, page: undefined, ...overrides } as Record<string, string | number | undefined>;
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, String(v)));
    const s = p.toString();
    return `/products${s ? `?${s}` : ""}`;
  };

  return (
    <div className="container-x py-6 sm:py-10">
      <nav className="text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-700">Home</Link> / <Link href="/products" className="hover:text-brand-700">Products</Link>
        {current && <> / <span className="text-ink">{current.name}</span></>}
      </nav>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {search ? <>Results for “{search}”</> : current ? current.name : "All products"}
          </h1>
          {result && <p className="mt-1 text-sm text-muted">{result.total} products found</p>}
        </div>
        <SortSelect value={sort} />
      </div>

      <div className="scrollbar-none -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={link({ category: undefined })} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${!category ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300"}`}>
          All
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={link({ category: c.slug })} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${category === c.slug ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300"}`}>
            {c.name}
          </Link>
        ))}
      </div>

      {!result || result.data.length === 0 ? (
        <div className="card mt-8 grid place-items-center p-12 text-center">
          <PackageSearch className="size-12 text-brand-300" />
          <p className="mt-3 font-semibold">No products found</p>
          <p className="mt-1 text-sm text-muted">Try a different search or category.</p>
          <Link href="/products" className="btn-primary mt-5">Clear filters</Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {result.data.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
          </div>
          {result.last_page > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {page > 1 && <Link href={link({ page: page - 1 })} className="btn-secondary !px-3"><ChevronLeft className="size-4" /> Prev</Link>}
              <span className="px-3 text-sm font-semibold text-muted">Page {page} of {result.last_page}</span>
              {page < result.last_page && <Link href={link({ page: page + 1 })} className="btn-secondary !px-3">Next <ChevronRight className="size-4" /></Link>}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
