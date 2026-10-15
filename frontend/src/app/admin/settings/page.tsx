"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Spinner } from "@/components/admin/ui";
import RequireAuth from "@/components/RequireAuth";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { api, ApiError } from "@/lib/api";

type S = Record<"store_name" | "whatsapp_number" | "support_email" | "free_shipping_above" | "shipping_charge" | "announcement", string>;

function SettingsInner() {
  const [s, setS] = useState<S | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<S>("/admin/settings").then(setS).catch(() => {});
  }, []);
  if (!s) return <Spinner />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      setS(await api<S>("/admin/settings", { method: "PUT", body: s }));
      toast.success("Settings saved. The store updates within a few minutes.");
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors());
    } finally {
      setBusy(false);
    }
  };

  const field = (k: keyof S, label: string, help?: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} className="input" value={s[k] ?? ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} {...props} />
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );

  return (
    <>
      <PageHeader title="Store settings" />
      <form onSubmit={save} className="max-w-2xl space-y-5">
        <section className="card space-y-4 border-emerald-200 p-5">
          <h2 className="flex items-center gap-2 font-bold text-emerald-700"><WhatsAppIcon /> WhatsApp orders</h2>
          {field("whatsapp_number", "Your WhatsApp number", "With country code, digits only. Example: 919876543210. Every order is sent to this number.", { required: true, inputMode: "tel" })}
        </section>
        <section className="card space-y-4 p-5">
          <h2 className="font-bold">General</h2>
          {field("store_name", "Store name", undefined, { required: true })}
          {field("support_email", "Support email", undefined, { type: "email" })}
          {field("announcement", "Announcement bar text", "Shown at the top of every page. Leave empty to hide.")}
        </section>
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="font-bold sm:col-span-2">Shipping</h2>
          {field("shipping_charge", "Delivery charge (₹)", undefined, { type: "number", min: 0, required: true })}
          {field("free_shipping_above", "Free delivery above (₹)", "Set 0 to always charge delivery.", { type: "number", min: 0, required: true })}
        </section>
        <button className="btn-primary" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} Save settings</button>
      </form>
    </>
  );
}

export default function AdminSettingsPage() {
  return <RequireAuth roles={["admin"]}><SettingsInner /></RequireAuth>;
}
