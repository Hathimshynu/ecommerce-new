"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Empty, PageHeader, Spinner } from "@/components/admin/ui";
import Modal from "@/components/Modal";
import SafeImage from "@/components/SafeImage";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const load = useCallback(() => {
    api<Category[]>("/admin/categories").then(setList).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"? Products will become uncategorised.`)) return;
    try {
      await api(`/admin/categories/${c.id}`, { method: "DELETE" });
      toast.success("Category deleted");
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
  };

  return (
    <>
      <PageHeader title="Categories" action={<button onClick={() => setEditing("new")} className="btn-primary"><Plus className="size-4" /> Add category</button>} />
      {!list ? <Spinner /> : list.length === 0 ? <Empty text="No categories yet." /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <div key={c.id} className="card flex items-center gap-3 p-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-slate-50"><SafeImage src={c.image_url} alt="" fill sizes="56px" className="object-cover" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="text-xs text-muted">{c.products_count ?? 0} products · order {c.sort_order}{!c.is_active && " · hidden"}</p>
              </div>
              <button onClick={() => setEditing(c)} className="grid size-9 place-items-center rounded-lg hover:bg-slate-100" aria-label="Edit"><Pencil className="size-4" /></button>
              {user?.role === "admin" && <button onClick={() => remove(c)} className="grid size-9 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete"><Trash2 className="size-4" /></button>}
            </div>
          ))}
        </div>
      )}
      {editing && <CategoryModal category={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
}

function CategoryModal({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [sort, setSort] = useState(String(category?.sort_order ?? 0));
  const [active, setActive] = useState(category?.is_active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", name);
    fd.append("sort_order", sort || "0");
    fd.append("is_active", active ? "1" : "0");
    if (file) fd.append("image", file);
    setBusy(true);
    try {
      await api(category ? `/admin/categories/${category.id}` : "/admin/categories", { body: fd });
      toast.success("Category saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={category ? "Edit category" : "Add category"}>
      <form onSubmit={save} className="space-y-4">
        <div><label className="label">Name</label><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">Sort order</label><input className="input" type="number" min={0} value={sort} onChange={(e) => setSort(e.target.value)} /></div>
        <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm font-semibold">Visible in store <input type="checkbox" className="size-5 accent-brand-600" checked={active} onChange={(e) => setActive(e.target.checked)} /></label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-4 text-sm text-muted hover:border-brand-400">
          <ImagePlus className="size-5" /> {file ? file.name : "Choose category image"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} Save</button>
      </form>
    </Modal>
  );
}
