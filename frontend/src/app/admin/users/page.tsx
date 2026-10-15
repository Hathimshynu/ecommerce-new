"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Empty, PageHeader, Pager, Spinner } from "@/components/admin/ui";
import Modal from "@/components/Modal";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { formatDate, initials } from "@/lib/format";
import type { Paginated, Role, User } from "@/lib/types";

const ROLE_INFO: Record<Role, string> = {
  admin: "Full access including users, settings and deleting",
  staff: "Manage products, orders, categories and reviews",
  customer: "Shop, place orders and write reviews",
};

function UsersInner() {
  const { user: me } = useAuth();
  const [data, setData] = useState<Paginated<User> | null>(null);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page: String(page) });
    if (role) qs.set("role", role);
    if (query) qs.set("search", query);
    api<Paginated<User>>(`/admin/users?${qs}`).then(setData).catch(() => {});
  }, [page, role, query]);
  useEffect(load, [load]);

  const update = async (u: User, body: Partial<User>) => {
    try {
      await api(`/admin/users/${u.id}`, { method: "PATCH", body });
      toast.success("User updated");
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  return (
    <>
      <PageHeader title="Users & roles" subtitle="Role based access: admin, staff and customer" action={<button onClick={() => setAdding(true)} className="btn-primary"><Plus className="size-4" /> Add user</button>} />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {(Object.keys(ROLE_INFO) as Role[]).map((r) => (
          <div key={r} className="card flex gap-3 p-4">
            <ShieldCheck className="size-5 shrink-0 text-brand-600" />
            <div><p className="text-sm font-bold capitalize">{r}</p><p className="text-xs text-muted">{ROLE_INFO[r]}</p></div>
          </div>
        ))}
      </div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={(e) => { e.preventDefault(); setQuery(search); setPage(1); }} className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input !pl-10" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        <select className="input sm:!w-44" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option><option value="admin">Admin</option><option value="staff">Staff</option><option value="customer">Customer</option>
        </select>
      </div>
      {!data ? <Spinner /> : data.data.length === 0 ? <Empty text="No users found." /> : (
        <>
          <div className="card divide-y divide-slate-100">
            {data.data.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{initials(u.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.name} {u.id === me?.id && <span className="text-xs text-muted">(you)</span>}</p>
                  <p className="truncate text-xs text-muted">{u.email}{u.phone && ` · ${u.phone}`} · joined {formatDate(u.created_at)} · {u.orders_count ?? 0} orders</p>
                </div>
                <select className="input !w-32 !py-1.5" value={u.role} disabled={u.id === me?.id} onChange={(e) => update(u, { role: e.target.value as Role })}>
                  <option value="admin">Admin</option><option value="staff">Staff</option><option value="customer">Customer</option>
                </select>
                <button disabled={u.id === me?.id} onClick={() => update(u, { is_active: !u.is_active })} className={`badge !py-1.5 disabled:opacity-50 ${u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {u.is_active ? "Active" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
          <Pager page={data.current_page} last={data.last_page} onChange={setPage} />
        </>
      )}
      {adding && <AddUserModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
    </>
  );
}

function AddUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "staff", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/admin/users", { body: form });
      toast.success("User created");
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors());
    } finally {
      setBusy(false);
    }
  };
  const f = (k: keyof typeof form, label: string, type = "text") => (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} required={k !== "phone"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );
  return (
    <Modal open onClose={onClose} title="Add user">
      <form onSubmit={save} className="space-y-4">
        {f("name", "Name")}
        {f("email", "Email", "email")}
        {f("phone", "Phone (optional)", "tel")}
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="staff">Staff</option><option value="admin">Admin</option><option value="customer">Customer</option>
          </select>
        </div>
        {f("password", "Password", "password")}
        <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} Create user</button>
      </form>
    </Modal>
  );
}

export default function AdminUsersPage() {
  return <RequireAuth roles={["admin"]}><UsersInner /></RequireAuth>;
}
