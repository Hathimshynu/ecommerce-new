"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";
import { Spinner } from "@/components/admin/ui";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  useEffect(() => {
    api<Product>(`/admin/products/${id}`).then(setProduct).catch(() => {});
  }, [id]);
  if (!product) return <Spinner />;
  return (
    <>
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-brand-700"><ArrowLeft className="size-4" /> Products</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Edit product</h1>
        <Link href={`/products/${product.slug}`} target="_blank" className="btn-secondary !py-2"><ExternalLink className="size-4" /> View in store</Link>
      </div>
      <ProductForm key={product.id} product={product} />
    </>
  );
}
