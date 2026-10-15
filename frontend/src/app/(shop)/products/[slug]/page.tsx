import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import ProductActions from "@/components/ProductActions";
import ReviewCard from "@/components/ReviewCard";
import { RatingBadge } from "@/components/Stars";
import { serverGet, SITE_URL } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Product, Review } from "@/lib/types";

export const revalidate = 60;

type Data = { product: Product; reviews: Review[]; related: Product[] };
type Params = Promise<{ slug: string }>;

const load = (slug: string) => serverGet<Data>(`/products/${encodeURIComponent(slug)}`);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load((await params).slug);
  if (!data) return { title: "Product not found" };
  const p = data.product;
  const description = p.meta_description || p.short_description || p.description?.slice(0, 160) || p.name;
  return {
    title: p.meta_title || p.name,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      type: "website",
      title: p.meta_title || p.name,
      description,
      url: `${SITE_URL}/products/${p.slug}`,
      images: p.images.slice(0, 4).map((i) => ({ url: i.url, alt: p.name })),
    },
    twitter: { card: "summary_large_image", title: p.name, description, images: p.images[0]?.url },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const data = await load((await params).slug);
  if (!data) notFound();
  const { product: p, reviews, related } = data;
  const avg = Number(p.reviews_avg_rating || 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.images.map((i) => i.url),
    description: p.short_description || p.description,
    sku: p.sku || undefined,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    category: p.category?.name,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${p.slug}`,
      priceCurrency: "INR",
      price: p.price,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: p.reviews_count ? { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: p.reviews_count } : undefined,
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: r.rating },
      author: { "@type": "Person", name: r.user?.name ?? "Customer" },
      reviewBody: r.comment,
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(p.category ? [{ "@type": "ListItem", position: 2, name: p.category.name, item: `${SITE_URL}/products?category=${p.category.slug}` }] : []),
      { "@type": "ListItem", position: p.category ? 3 : 2, name: p.name, item: `${SITE_URL}/products/${p.slug}` },
    ],
  };

  return (
    <div className="container-x py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbLd]).replace(/</g, "\\u003c") }} />
      <nav className="truncate text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        {p.category && <> / <Link href={`/products?category=${p.category.slug}`} className="hover:text-brand-700">{p.category.name}</Link></>}
        {" / "}<span className="text-ink">{p.name}</span>
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={p.images} name={p.name} />

        <div>
          {p.brand && <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{p.brand}</p>}
          <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{p.name}</h1>
          <div className="mt-3"><RatingBadge value={avg} count={p.reviews_count} /></div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-extrabold">{formatPrice(p.price)}</span>
            {p.mrp && p.mrp > p.price && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatPrice(p.mrp)}</span>
                <span className="text-lg font-bold text-emerald-600">{p.discount_percent}% off</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted">Inclusive of all taxes</p>

          {p.short_description && <p className="mt-4 leading-relaxed text-slate-600">{p.short_description}</p>}

          <p className={`mt-4 text-sm font-semibold ${p.stock > 0 ? (p.stock <= 5 ? "text-orange-600" : "text-emerald-600") : "text-rose-600"}`}>
            {p.stock > 0 ? (p.stock <= 5 ? `Hurry, only ${p.stock} left!` : "In stock") : "Currently out of stock"}
          </p>

          <ProductActions product={p} />

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
            {[
              { icon: Truck, t: "Fast delivery" },
              { icon: RotateCcw, t: "Easy returns" },
              { icon: ShieldCheck, t: "Secure order" },
            ].map(({ icon: Icon, t }) => (
              <div key={t} className="rounded-xl bg-white p-3 ring-1 ring-slate-200/70">
                <Icon className="mx-auto size-5 text-brand-600" />
                <p className="mt-1 font-semibold text-slate-600">{t}</p>
              </div>
            ))}
          </div>

          {p.specifications && p.specifications.length > 0 && (
            <section className="card mt-6 overflow-hidden">
              <h2 className="border-b border-slate-100 px-5 py-3 font-bold">Specifications</h2>
              <dl className="divide-y divide-slate-100 text-sm">
                {p.specifications.map((s, i) => (
                  <div key={i} className="grid grid-cols-5 gap-4 px-5 py-3">
                    <dt className="col-span-2 text-muted">{s.label}</dt>
                    <dd className="col-span-3 font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {p.description && (
            <section className="card mt-6 p-5">
              <h2 className="font-bold">Product description</h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{p.description}</div>
            </section>
          )}
        </div>
      </div>

      <section className="mt-14" id="reviews">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-extrabold sm:text-2xl">Ratings & reviews</h2>
          {p.reviews_count ? <RatingBadge value={avg} count={p.reviews_count} /> : null}
        </div>
        {reviews.length === 0 ? (
          <div className="card mt-5 flex items-center gap-3 p-6 text-sm text-muted">
            <BadgeCheck className="size-5 text-brand-500" /> No reviews yet. Customers who buy this product can review it from “My orders”.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} showProduct={false} />)}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-extrabold sm:text-2xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {related.slice(0, 4).map((r) => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      )}
      {/* room for the sticky Add to cart / Buy now bar on phones */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
