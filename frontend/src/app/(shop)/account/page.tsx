"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, LogOut, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { initials } from "@/lib/format";
import type { User } from "@/lib/types";

export default function AccountPage() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const r = await api<{ user: User }>("/auth/profile", { method: "PUT", body: form });
      setUser(r.user);
      setForm((f) => ({ ...f, password: "", password_confirmation: "" }));
      toast.success("Profile updated");
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x max-w-3xl py-6 sm:py-10">
      <div className="card flex items-center gap-4 p-5">
        <span className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-lg font-bold text-white">{initials(user.name)}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Hello,</p>
          <h1 className="truncate text-lg font-extrabold">{user.name}</h1>
          <p className="truncate text-sm text-muted">{user.email}</p>
        </div>
        <button onClick={logout} className="btn-danger !px-3"><LogOut className="size-4" /><span className="hidden sm:inline">Logout</span></button>
      </div>

      <Link href="/account/orders" className="card mt-4 flex items-center gap-3 p-5 transition hover:ring-2 hover:ring-brand-100">
        <Package className="size-6 text-brand-600" />
        <div className="flex-1">
          <p className="font-bold">My orders</p>
          <p className="text-sm text-muted">Track orders, send on WhatsApp and write reviews</p>
        </div>
      </Link>

      <form onSubmit={save} className="card mt-4 space-y-4 p-5 sm:p-6">
        <h2 className="font-bold">Personal information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Mobile number</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            {errors.phone && <p className="field-error">{errors.phone}</p>}
          </div>
          <div>
            <label className="label">New password <span className="text-muted">(optional)</span></label>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" className="input" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} autoComplete="new-password" />
          </div>
        </div>
        <button className="btn-primary" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} Save changes</button>
      </form>
    </div>
  );
}
