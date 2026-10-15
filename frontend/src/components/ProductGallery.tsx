"use client";

import { useRef, useState } from "react";
import SafeImage from "./SafeImage";
import type { ProductImage } from "@/lib/types";

/** Swipeable gallery on mobile, thumbnail rail on desktop. */
export default function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const list = images.length ? images : [{ id: 0, url: "", sort_order: 0 }];

  const go = (i: number) => {
    setActive(i);
    const el = scroller.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  };

  return (
    <div className="lg:sticky lg:top-36 lg:self-start">
      <div className="flex flex-col-reverse gap-3 lg:flex-row">
        {list.length > 1 && (
          <div className="scrollbar-none flex gap-2 overflow-x-auto lg:max-h-[520px] lg:flex-col lg:overflow-y-auto">
            {list.map((img, i) => (
              <button
                key={img.id}
                onClick={() => go(i)}
                aria-label={`Show image ${i + 1}`}
                className={`relative size-16 shrink-0 overflow-hidden rounded-xl bg-white ring-2 transition sm:size-20 ${active === i ? "ring-brand-500" : "ring-transparent opacity-70 hover:opacity-100"}`}
              >
                <SafeImage src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="card relative flex-1 overflow-hidden">
          <div
            ref={scroller}
            className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
            onScroll={(e) => {
              const el = e.currentTarget;
              const i = Math.round(el.scrollLeft / el.clientWidth);
              if (i !== active) setActive(i);
            }}
          >
            {list.map((img, i) => (
              <div key={img.id} className="relative aspect-square w-full shrink-0 snap-center bg-white">
                <SafeImage src={img.url} alt={i === 0 ? name : `${name} – image ${i + 1}`} fill priority={i === 0} sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              </div>
            ))}
          </div>
          {list.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 lg:hidden">
              {list.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${active === i ? "w-5 bg-brand-600" : "w-1.5 bg-slate-300"}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
