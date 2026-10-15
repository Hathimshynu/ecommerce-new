"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types";

export default function QuickAdd({ product }: { product: Product }) {
  const { add } = useCart();
  return (
    <button
      type="button"
      aria-label={`Add ${product.name} to cart`}
      onClick={() => {
        add(product);
        toast.success("Added to cart", { description: product.name });
      }}
      className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 transition hover:bg-brand-600 hover:text-white"
    >
      <Plus className="size-4" />
    </button>
  );
}
