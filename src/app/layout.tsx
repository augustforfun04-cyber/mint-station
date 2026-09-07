import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manual Token Lab — deploy & mint supply ke wallet tujuan",
  description:
    "Deploy ERC-20 on-chain tanpa Bankr API. Total supply, mint ke wallet tujuan, sisa, mintable, dan chain semuanya diatur manual.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-white/10 py-6 text-center text-xs text-muted-foreground">
            Kontrak ERC-20 kamu sendiri · wallet menandatangani deploy · tidak
            ada Bankr API.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
