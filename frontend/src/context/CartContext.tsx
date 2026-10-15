"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";

export interface CartItem {
  product_id: number;
  slug: string;
  name: string;
  price: number;
  mrp: number | null;
  image: string | null;
  stock: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  mrpTotal: number;
  ready: boolean;
  add: (p: Product, qty?: number) => void;
  update: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

const KEY = "shop_cart";
const MAX_QTY = 20;
const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Cart lives in localStorage, which only exists after hydration.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {
      setItems([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((p: Product, qty = 1) => {
    setItems((prev) => {
      const limit = Math.min(MAX_QTY, p.stock);
      const existing = prev.find((i) => i.product_id === p.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === p.id ? { ...i, quantity: Math.min(limit, i.quantity + qty), stock: p.stock, price: p.price } : i,
        );
      }
      return [
        ...prev,
        {
          product_id: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price,
          mrp: p.mrp,
          image: p.images?.[0]?.url ?? null,
          stock: p.stock,
          quantity: Math.min(limit, qty),
        },
      ];
    });
  }, []);

  const update = useCallback((productId: number, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId ? { ...i, quantity: Math.max(1, Math.min(qty, Math.min(MAX_QTY, i.stock))) } : i,
      ),
    );
  }, []);

  const remove = useCallback((productId: number) => setItems((prev) => prev.filter((i) => i.product_id !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const mrpTotal = items.reduce((s, i) => s + (i.mrp || i.price) * i.quantity, 0);
    return { items, count, subtotal, mrpTotal, ready, add, update, remove, clear };
  }, [items, ready, add, update, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
