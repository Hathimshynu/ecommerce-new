import type { MetadataRoute } from "next";
import { serverGet, SITE_URL } from "@/lib/api";

export const revalidate = 3600;

type SitemapData = { products: { slug: string; updated_at: string }[]; categories: { slug: string; updated_at: string }[] };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await serverGet<SitemapData>("/sitemap", 3600);
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    ...(data?.categories ?? []).map((c) => ({
      url: `${SITE_URL}/products?category=${c.slug}`,
      lastModified: c.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(data?.products ?? []).map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
