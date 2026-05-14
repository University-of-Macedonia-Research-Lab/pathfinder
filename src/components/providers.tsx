"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>{children}</LanguageProvider>
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
