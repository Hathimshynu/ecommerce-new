"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Package, Search, ShoppingBag, User as UserIcon } from "lucide-react";
import { isStaffRole, useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { initials } from "@/lib/format";
import type { Category } from "@/lib/types";

function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("search") ?? "");
  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/products?search=${encodeURIComponent(q.trim())}` : "/products");
      }}
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search for products, brands and more"
        aria-label="Search products"
        className="w-full rounded-xl border border-transparent bg-slate-100 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
    </form>
  );
}

function AccountMenu() {
  const { user, loading, logout } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // Remember which page the menu was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof v === "function" ? v(open) : v) ? pathname : null);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpenOn(null);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (loading) return <div className="size-9 animate-pulse rounded-full bg-slate-100" />;
  if (!user)
    return (
      <Link href="/login" className="btn-primary hidden !px-4 !py-2 md:inline-flex">
        <UserIcon className="size-4" /> Login
      </Link>
    );

  return (
    <div ref={ref} className="relative hidden md:block">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100">
        <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials(user.name)}</span>
        <span className="max-w-28 truncate text-sm font-semibold">{user.name.split(" ")[0]}</span>
        <ChevronDown className="size-4 text-slate-400" />
      </button>
      {open && (
        <div className="card absolute right-0 top-12 z-50 w-56 p-2">
          {isStaffRole(user) && (
            <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
              <LayoutDashboard className="size-4 text-brand-600" /> Admin panel
            </Link>
          )}
          <Link href="/account/orders" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
            <Package className="size-4 text-brand-600" /> My orders
          </Link>
          <Link href="/account" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
            <UserIcon className="size-4 text-brand-600" /> My profile
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header({ categories }: { categories: Category[] }) {
  const { store_name, announcement } = useSettings();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      {announcement && (
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-violet-600 px-4 py-1.5 text-center text-[11px] font-medium text-white sm:text-xs">
          {announcement}
        </div>
      )}
      <div className="container-x flex h-16 items-center gap-3 md:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${store_name} home`}>
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md shadow-brand-500/30">
            <ShoppingBag className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">{store_name}</span>
        </Link>
        <Suspense fallback={<div className="hidden flex-1 md:block" />}>
          <SearchBox className="hidden flex-1 md:block md:max-w-xl" />
        </Suspense>
        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link href="/products" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 lg:block">
            Shop
          </Link>
          <AccountMenu />
          <Link href="/cart" aria-label="Cart" className="relative grid size-10 place-items-center rounded-xl hover:bg-slate-100">
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
      <div className="container-x pb-3 md:hidden">
        <Suspense fallback={null}>
          <SearchBox />
        </Suspense>
      </div>
      {categories.length > 0 && (
        <div className="border-t border-slate-100">
          <div className="container-x scrollbar-none flex gap-1 overflow-x-auto py-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 sm:text-sm"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
