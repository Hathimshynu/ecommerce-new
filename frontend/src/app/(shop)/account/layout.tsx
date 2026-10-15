import type { Metadata } from "next";
import RequireAuth from "@/components/RequireAuth";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
