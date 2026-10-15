"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderTree, LayoutDashboard, LogOut, Menu, MessageSquareText, Package, Settings, ShoppingBag, Store, Users, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { initials } from "@/lib/format";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
  { href: "/admin/users", label: "Users & roles", icon: Users, adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { store_name } = useSettings();
  const pathname = usePathname();
  // Remember which page the drawer was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);

  const nav = NAV.filter((n) => !n.adminOnly || user?.role === "admin");
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-2 px-5 py-5">
        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white"><ShoppingBag className="size-5" /></span>
        <div>
          <p className="font-extrabold leading-tight">{store_name}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Admin panel</p>
        </div>
      </Link>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive(href) ? "bg-brand-600 text-white shadow-md shadow-brand-600/20" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Icon className="size-[18px]" /> {label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-slate-100 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          <Store className="size-[18px]" /> View store
        </Link>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials(user?.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="text-[11px] font-semibold uppercase text-muted">{user?.role}</p>
          </div>
          <button onClick={logout} aria-label="Logout" className="grid size-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50"><LogOut className="size-4" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-5 grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close menu"><X className="size-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-lg hover:bg-slate-100" aria-label="Open menu"><Menu className="size-5" /></button>
          <span className="font-bold">{nav.find((n) => isActive(n.href))?.label ?? "Admin"}</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
