"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Package, ShoppingBag, User } from "lucide-react";
import { isStaffRole, useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

/** App-style tab bar shown on phones. */
export default function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();
  const { user } = useAuth();

  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "Shop", icon: LayoutGrid },
    { href: "/cart", label: "Cart", icon: ShoppingBag, badge: count },
    { href: "/account/orders", label: "Orders", icon: Package },
    { href: user ? (isStaffRole(user) ? "/admin" : "/account") : "/login", label: user ? (isStaffRole(user) ? "Admin" : "Account") : "Login", icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, badge }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={label} href={href} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active ? "text-brand-600" : "text-slate-500"}`}>
              <Icon className="size-5" />
              {label}
              {badge ? (
                <span className="absolute right-[calc(50%-18px)] top-1.5 grid min-w-4 place-items-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">{badge}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
