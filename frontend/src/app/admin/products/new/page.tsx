import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <>
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-brand-700"><ArrowLeft className="size-4" /> Products</Link>
      <h1 className="mb-6 mt-3 text-2xl font-extrabold">Add product</h1>
      <ProductForm />
    </>
  );
}
