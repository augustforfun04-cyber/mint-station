"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { BankrSessionProvider } from "@/components/bankr-session";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider delayDuration={200}>
        <BankrSessionProvider>
          {children}
          <Toaster position="top-right" />
        </BankrSessionProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
