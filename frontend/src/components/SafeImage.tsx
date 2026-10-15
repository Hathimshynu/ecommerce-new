"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { PLACEHOLDER_IMG } from "@/lib/format";

/** next/image with a soft placeholder when the source is missing or fails to load. */
export default function SafeImage({ src, alt, ...rest }: Omit<ImageProps, "src"> & { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  return <Image {...rest} alt={alt} src={!src || failed ? PLACEHOLDER_IMG : src} onError={() => setFailed(true)} />;
}
