"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpToLine, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import SafeImage from "@/components/SafeImage";
import { api, ApiError } from "@/lib/api";
import type { Category, Product, Spec } from "@/lib/types";

type Form = {
  name: string; category_id: string; brand: string; sku: string; price: string; mrp: string; stock: string;
  short_description: string; description: string; meta_title: string; meta_description: string;
  is_active: boolean; is_featured: boolean;
};

const empty: Form = {
  name: "", category_id: "", brand: "", sku: "", price: "", mrp: "", stock: "10",
  short_description: "", description: "", meta_title: "", meta_description: "", is_active: true, is_featured: false,
};

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<Form>(() =>
    product
      ? {
          name: product.name, category_id: product.category_id ? String(product.category_id) : "", brand: product.brand ?? "",
          sku: product.sku ?? "", price: String(product.price), mrp: product.mrp ? String(product.mrp) : "", stock: String(product.stock),
          short_description: product.short_description ?? "", description: product.description ?? "",
          meta_title: product.meta_title ?? "", meta_description: product.meta_description ?? "",
          is_active: product.is_active, is_featured: product.is_featured,
        }
      : empty,
  );
  const [specs, setSpecs] = useState<Spec[]>(product?.specifications ?? []);
  const [existing, setExisting] = useState(product?.images ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Category[]>("/admin/categories").then(setCategories).catch(() => {});
  }, []);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const deleteImage = async (imageId: number) => {
    if (!product || !confirm("Delete this image?")) return;
    const p = await api<Product>(`/admin/products/${product.id}/images/${imageId}`, { method: "DELETE" });
    setExisting(p.images);
  };

  const makeCover = async (imageId: number) => {
    if (!product) return;
    const order = [imageId, ...existing.filter((i) => i.id !== imageId).map((i) => i.id)];
    const p = await api<Product>(`/admin/products/${product.id}/images/order`, { method: "PUT", body: { order } });
    setExisting(p.images);
    toast.success("Cover image updated");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, typeof v === "boolean" ? (v ? "1" : "0") : v));
    fd.append("specifications", JSON.stringify(specs.filter((s) => s.label.trim() && s.value.trim())));
    files.forEach((f) => fd.append("images[]", f));
    try {
      const saved = await api<Product>(product ? `/admin/products/${product.id}` : "/admin/products", { body: fd });
      toast.success(product ? "Product updated" : "Product created");
      if (product) {
        setExisting(saved.images);
        setFiles([]);
      } else router.replace(`/admin/products/${saved.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors());
        toast.error(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const text = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={props.className}>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} className="input" value={form[k] as string} onChange={set(k)} {...props} />
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <section className="card space-y-4 p-5">
          <h2 className="font-bold">Basic details</h2>
          {text("name", "Product name", { required: true })}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="category_id">Category</label>
              <select id="category_id" className="input" value={form.category_id} onChange={set("category_id")}>
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {text("brand", "Brand")}
            {text("sku", "SKU")}
          </div>
          <div>
            <label className="label" htmlFor="short_description">Short description</label>
            <textarea id="short_description" className="input min-h-16" maxLength={500} value={form.short_description} onChange={set("short_description")} placeholder="One or two lines shown near the price" />
          </div>
          <div>
            <label className="label" htmlFor="description">Full description</label>
            <textarea id="description" className="input min-h-40" value={form.description} onChange={set("description")} placeholder="Features, materials, what's in the box, care instructions…" />
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Product images</h2>
            <span className="text-xs text-muted">First image is the cover · up to 10 per upload</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {existing.map((img, idx) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200">
                <SafeImage src={img.url} alt="" fill sizes="150px" className="object-cover" />
                {idx === 0 && <span className="badge absolute left-1.5 top-1.5 bg-brand-600 text-white">Cover</span>}
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">
                  {idx > 0 && (
                    <button type="button" onClick={() => makeCover(img.id)} className="grid size-7 place-items-center rounded-lg bg-white/95 shadow" title="Make cover"><ArrowUpToLine className="size-3.5" /></button>
                  )}
                  <button type="button" onClick={() => deleteImage(img.id)} className="grid size-7 place-items-center rounded-lg bg-white/95 text-rose-600 shadow" title="Delete"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            ))}
            {previews.map((src, idx) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-xl ring-2 ring-dashed ring-brand-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-cover" />
                <span className="badge absolute left-1.5 top-1.5 bg-amber-400 text-slate-900">New</span>
                <button type="button" onClick={() => setFiles((f) => f.filter((_, i) => i !== idx))} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-lg bg-white/95 shadow" aria-label="Remove"><X className="size-3.5" /></button>
              </div>
            ))}
            <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 text-center text-slate-400 transition hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-600">
              <span><ImagePlus className="mx-auto size-7" /><span className="mt-1 block text-xs font-semibold">Add images</span></span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const picked = Array.from(e.target.files || []);
                  setFiles((f) => [...f, ...picked].slice(0, 10));
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {Object.keys(errors).some((k) => k.startsWith("images")) && <p className="field-error">Images must be JPG/PNG/WEBP/AVIF up to 5 MB each.</p>}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Specifications</h2>
            <button type="button" onClick={() => setSpecs((s) => [...s, { label: "", value: "" }])} className="btn-secondary !px-3 !py-1.5"><Plus className="size-4" /> Add row</button>
          </div>
          {specs.length === 0 && <p className="mt-3 text-sm text-muted">e.g. Material → Cotton, Warranty → 1 Year</p>}
          <div className="mt-3 space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input className="input" placeholder="Label" value={s.label} onChange={(e) => setSpecs((all) => all.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <input className="input" placeholder="Value" value={s.value} onChange={(e) => setSpecs((all) => all.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                <button type="button" onClick={() => setSpecs((all) => all.filter((_, j) => j !== i))} className="btn-danger !px-3" aria-label="Remove row"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-bold">SEO</h2>
          {text("meta_title", "Meta title", { placeholder: "Defaults to the product name", maxLength: 255 })}
          <div>
            <label className="label" htmlFor="meta_description">Meta description</label>
            <textarea id="meta_description" className="input min-h-20" maxLength={500} value={form.meta_description} onChange={set("meta_description")} placeholder="Shown in Google search results (~155 characters)" />
            <p className="mt-1 text-right text-xs text-muted">{form.meta_description.length}/160</p>
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="card space-y-4 p-5 lg:sticky lg:top-6">
          <h2 className="font-bold">Pricing & stock</h2>
          {text("price", "Selling price (₹)", { required: true, type: "number", min: 0, step: "0.01", inputMode: "decimal" })}
          {text("mrp", "MRP (₹) – for discount", { type: "number", min: 0, step: "0.01", inputMode: "decimal" })}
          {text("stock", "Stock quantity", { required: true, type: "number", min: 0, inputMode: "numeric" })}
          <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold">
            Visible in store <input type="checkbox" className="size-5 accent-brand-600" checked={form.is_active} onChange={set("is_active")} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold">
            Featured on home page <input type="checkbox" className="size-5 accent-brand-600" checked={form.is_featured} onChange={set("is_featured")} />
          </label>
          <button className="btn-primary w-full !py-3" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} {product ? "Save changes" : "Create product"}</button>
        </section>
      </aside>
    </form>
  );
}
