"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/types";

/** Client-side guard. The API enforces the same rules server-side. */
export default function RequireAuth({ roles, children }: { roles?: Role[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !!user && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!allowed) router.replace("/");
  }, [loading, user, allowed, router, pathname]);

  if (loading || !allowed)
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-7 animate-spin text-brand-600" />
      </div>
    );
  return <>{children}</>;
}
