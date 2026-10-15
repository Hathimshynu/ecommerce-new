import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { getSettings, SITE_URL } from "@/lib/api";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { store_name } = await getSettings();
  const description = `Shop the best products online at ${store_name}. Genuine products, great prices, fast delivery and easy WhatsApp order confirmation.`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${store_name} – Online Shopping for Electronics, Fashion & More`, template: `%s | ${store_name}` },
    description,
    applicationName: store_name,
    alternates: { canonical: "/" },
    openGraph: { type: "website", siteName: store_name, title: store_name, description, url: SITE_URL, locale: "en_IN" },
    twitter: { card: "summary_large_image", title: store_name, description },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Providers settings={settings}>{children}</Providers>
      </body>
    </html>
  );
}
