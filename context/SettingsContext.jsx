"use client";
// Client-side access to admin-editable site config (branding + pricing).
// The root layout fetches the values server-side via getSettings() and feeds
// them in here, so client components (Footer, Hero, PricingPlans, …) render
// the live values instead of the hardcoded SITE constants. SITE still backs
// the fallback so the tree renders even before the provider value arrives.
import { createContext, useContext } from "react";
import { SITE } from "@/lib/catalog-shared";

const FALLBACK = {
  name: SITE.name,
  email: SITE.email,
  price: SITE.price,
  primaryColor: "#660e1b",
};

const SettingsContext = createContext(FALLBACK);
export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ value, children }) {
  return (
    <SettingsContext.Provider value={value ?? FALLBACK}>
      {children}
    </SettingsContext.Provider>
  );
}
