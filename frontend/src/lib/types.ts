export type Role = "admin" | "staff" | "customer";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  created_at?: string;
  orders_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  products_count?: number;
}

export interface ProductImage {
  id: number;
  url: string;
  sort_order: number;
}

export interface Spec {
  label: string;
  value: string;
}

export interface Product {
  id: number;
  category_id: number | null;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  short_description: string | null;
  description: string | null;
  specifications: Spec[] | null;
  price: number;
  mrp: number | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  discount_percent: number;
  images: ProductImage[];
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  reviews_avg_rating?: number | string | null;
  reviews_count?: number;
  updated_at?: string;
}

export type OrderStatus = "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled";

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  image_url: string | null;
  price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address_line: string;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  notes: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  whatsapp_sent_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  admin_note: string | null;
  whatsapp_url: string;
  created_at: string;
  items: OrderItem[];
  user?: Pick<User, "id" | "name" | "email" | "phone">;
}

export interface Review {
  id: number;
  rating: number;
  title: string | null;
  comment: string;
  image_urls: string[];
  is_approved: boolean;
  created_at: string;
  user?: Pick<User, "id" | "name">;
  product?: Pick<Product, "id" | "name" | "slug"> | null;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface StoreSettings {
  store_name: string;
  whatsapp_number: string;
  support_email: string;
  free_shipping_above: number;
  shipping_charge: number;
  announcement: string;
}
