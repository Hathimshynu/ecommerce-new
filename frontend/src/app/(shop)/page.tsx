import Link from "next/link";
import { ArrowRight, BadgeCheck, MessageCircle, RotateCcw, Truck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import SafeImage from "@/components/SafeImage";
import ReviewsSection from "@/components/ReviewsSection";
import { getCategories, getProducts, getReviews, getSettings } from "@/lib/api";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, categories, featured, latest, reviews] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts("featured=1&per_page=8"),
    getProducts("per_page=8&sort=latest"),
    getReviews("per_page=9"),
  ]);
  const heroProducts = (featured?.data.length ? featured.data : latest?.data ?? []).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.store_name,
    url: process.env.NEXT_PUBLIC_SITE_URL,
    contactPoint: settings.whatsapp_number
      ? { "@type": "ContactPoint", telephone: `+${settings.whatsapp_number}`, contactType: "customer service" }
      : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_80%_0%,#e0e7ff_0%,transparent_60%),radial-gradient(50%_60%_at_0%_100%,#fce7f3_0%,transparent_60%)]" />
        <div className="container-x grid items-center gap-10 py-10 md:grid-cols-2 md:py-20">
          <div>
            <span className="badge bg-white text-brand-700 shadow-sm ring-1 ring-brand-100">✨ New season collection</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Shop smarter.
              <br />
              <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">Live better.</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              Hand-picked products at honest prices. Place your order in seconds and confirm instantly on WhatsApp.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary !px-6 !py-3">
                Start shopping <ArrowRight className="size-4" />
              </Link>
              <a href="#reviews" className="btn-secondary !px-6 !py-3">Customer reviews</a>
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
            {heroProducts.map((p, i) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className={`card group relative overflow-hidden ${i === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"}`}
              >
                <SafeImage src={p.images[0]?.url} alt={p.name} fill priority sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-2 bottom-2 truncate rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold backdrop-blur">
                  {p.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="container-x">
        <div className="card grid grid-cols-2 gap-4 p-4 sm:p-6 lg:grid-cols-4">
          {[
            { icon: Truck, t: "Fast delivery", d: `Free above ₹${settings.free_shipping_above}` },
            { icon: BadgeCheck, t: "100% genuine", d: "Quality checked products" },
            { icon: RotateCcw, t: "Easy returns", d: "Hassle-free support" },
            { icon: MessageCircle, t: "WhatsApp orders", d: "Personal confirmation" },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold">{t}</p>
                <p className="text-xs text-muted">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-x mt-14">
          <SectionTitle title="Shop by category" href="/products" />
          <div className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
            {categories.map((c) => (
              <Link key={c.id} href={`/products?category=${c.slug}`} className="group w-28 shrink-0 text-center sm:w-auto">
                <div className="card relative mx-auto aspect-square overflow-hidden rounded-full sm:rounded-2xl">
                  <SafeImage src={c.image_url} alt={c.name} fill sizes="160px" className="object-cover transition duration-500 group-hover:scale-110" />
                </div>
                <p className="mt-2 text-sm font-semibold group-hover:text-brand-700">{c.name}</p>
                {c.products_count !== undefined && <p className="text-xs text-muted">{c.products_count} items</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured && featured.data.length > 0 && (
        <section className="container-x mt-14">
          <SectionTitle title="Featured picks" href="/products" />
          <ProductGrid>{featured.data.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}</ProductGrid>
        </section>
      )}

      {latest && latest.data.length > 0 && (
        <section className="container-x mt-14">
          <SectionTitle title="New arrivals" href="/products?sort=latest" />
          <ProductGrid>{latest.data.map((p) => <ProductCard key={p.id} product={p} />)}</ProductGrid>
        </section>
      )}

      {!featured && !latest && (
        <section className="container-x mt-14">
          <div className="card p-10 text-center text-muted">Products will appear here once the store API is running.</div>
        </section>
      )}

      <ReviewsSection initial={reviews?.data ?? []} />
    </>
  );
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
          View all <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}
