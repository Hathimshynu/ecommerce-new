import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import RequireAuth from "@/components/RequireAuth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["admin", "staff"]}>
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
