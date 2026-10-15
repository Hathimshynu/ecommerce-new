import type { Category, Paginated, Product, Review, StoreSettings } from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

const TOKEN_KEY = "shop_token";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;
  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
  /** First message per field, convenient for forms. */
  fieldErrors(): Record<string, string> {
    return Object.fromEntries(Object.entries(this.errors).map(([k, v]) => [k, v[0]]));
  }
}

type Body = Record<string, unknown> | FormData | undefined;

/** Browser-side API call with the customer's/admin's bearer token. */
export async function api<T = unknown>(path: string, options: { method?: string; body?: Body } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_URL}${path}`, { method: options.method || (body ? "POST" : "GET"), headers, body });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token) tokenStore.clear();
    throw new ApiError(data.message || "Something went wrong. Please try again.", res.status, data.errors || {});
  }
  return data as T;
}

/** Server-side fetch for SEO-rendered pages. Returns null if the API is unreachable. */
export async function serverGet<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const defaultSettings: StoreSettings = {
  store_name: "ShopEase",
  whatsapp_number: "",
  support_email: "",
  free_shipping_above: 499,
  shipping_charge: 40,
  announcement: "",
};

export const getSettings = async () => (await serverGet<StoreSettings>("/settings", 300)) ?? defaultSettings;
export const getCategories = async () => (await serverGet<Category[]>("/categories", 300)) ?? [];
export const getProducts = (query = "") => serverGet<Paginated<Product>>(`/products${query ? `?${query}` : ""}`);
export const getReviews = (query = "") => serverGet<Paginated<Review>>(`/reviews${query ? `?${query}` : ""}`, 60);
