"use client";

import { createContext, useContext } from "react";
import { defaultSettings } from "@/lib/api";
import type { StoreSettings } from "@/lib/types";

const SettingsContext = createContext<StoreSettings>(defaultSettings);

export function SettingsProvider({ value, children }: { value: StoreSettings; children: React.ReactNode }) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
