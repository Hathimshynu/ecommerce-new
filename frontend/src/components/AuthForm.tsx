"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Loader2, Package, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { ApiError } from "@/lib/api";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const { store_name } = useSettings();
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") || "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const user = mode === "login" ? await login(form.email, form.password) : await register(form);
      toast.success(`Welcome${mode === "login" ? " back" : ""}, ${user.name.split(" ")[0]}!`);
      const staff = user.role === "admin" || user.role === "staff";
      router.replace(next || (staff ? "/admin" : "/"));
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors());
        if (!Object.keys(err.errors).length) toast.error(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const field = (k: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} className="input" value={form[k]} onChange={set(k)} required {...props} />
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );

  const qs = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="container-x py-8 sm:py-14">
      <div className="card mx-auto grid max-w-4xl overflow-hidden md:grid-cols-5">
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-700 to-violet-700 p-8 text-white md:col-span-2 md:flex">
          <div>
            <h1 className="text-3xl font-extrabold">{mode === "login" ? "Login" : "Looks like you're new here!"}</h1>
            <p className="mt-3 text-brand-100">
              {mode === "login" ? "Get access to your orders, reviews and faster checkout." : `Sign up to start shopping at ${store_name}.`}
            </p>
          </div>
          <ul className="space-y-3 text-sm text-brand-100">
            <li className="flex items-center gap-2"><Package className="size-4" /> Track all your orders</li>
            <li className="flex items-center gap-2"><BadgeCheck className="size-4" /> Review products you bought</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4" /> Safe & secure account</li>
          </ul>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6 sm:p-10 md:col-span-3">
          <h2 className="text-xl font-extrabold md:hidden">{mode === "login" ? "Login to your account" : "Create your account"}</h2>
          {mode === "register" && field("name", "Full name", { autoComplete: "name" })}
          {field("email", "Email address", { type: "email", autoComplete: "email" })}
          {mode === "register" && field("phone", "Mobile number", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
          {field("password", "Password", { type: "password", autoComplete: mode === "login" ? "current-password" : "new-password", minLength: mode === "register" ? 6 : undefined })}
          {mode === "register" && field("password_confirmation", "Confirm password", { type: "password", autoComplete: "new-password" })}
          <button className="btn-buy w-full !py-3" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} {mode === "login" ? "Login" : "Create account"}
          </button>
          <p className="text-center text-sm text-muted">
            {mode === "login" ? (
              <>New here? <Link href={`/register${qs}`} className="font-semibold text-brand-600">Create an account</Link></>
            ) : (
              <>Already have an account? <Link href={`/login${qs}`} className="font-semibold text-brand-600">Login</Link></>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
