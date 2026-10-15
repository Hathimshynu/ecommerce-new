import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/api";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { store_name } = await getSettings();
  return {
    name: store_name,
    short_name: store_name,
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#4f46e5",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
