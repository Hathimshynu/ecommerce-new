"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types";

export default function ProductActions({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const max = Math.min(20, product.stock);
  const disabled = product.stock <= 0;

  return (
    <>
      {!disabled && (
        <div className="mt-5 flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-600">Quantity</span>
          <div className="flex items-center rounded-xl bg-white ring-1 ring-slate-200">
            <button className="grid size-10 place-items-center disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease">
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center font-bold">{qty}</span>
            <button className="grid size-10 place-items-center disabled:opacity-40" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} aria-label="Increase">
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      )}
      {/* Sticky on phones like a native shopping app */}
      <div className="fixed inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-30 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white p-3 md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
        <button
          className="btn-cart !py-3.5"
          disabled={disabled}
          onClick={() => {
            add(product, qty);
            toast.success("Added to cart", { description: product.name, action: { label: "View cart", onClick: () => router.push("/cart") } });
          }}
        >
          <ShoppingCart className="size-4" /> Add to cart
        </button>
        <button
          className="btn-buy !py-3.5"
          disabled={disabled}
          onClick={() => {
            add(product, qty);
            router.push("/checkout");
          }}
        >
          <Zap className="size-4" /> Buy now
        </button>
      </div>
    </>
  );
}
