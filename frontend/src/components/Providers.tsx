"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SettingsProvider } from "@/context/SettingsContext";
import type { StoreSettings } from "@/lib/types";

export default function Providers({ settings, children }: { settings: StoreSettings; children: React.ReactNode }) {
  return (
    <SettingsProvider value={settings}>
      <AuthProvider>
        <CartProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </CartProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
