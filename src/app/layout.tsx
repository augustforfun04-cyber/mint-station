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
  title: "Bankr Launchpad — Deploy token & mint ke wallet tujuan",
  description:
    "UI deploy token Bankr: fair launch Doppler/Uniswap V4, mint 15% supply ke wallet yang dituju, simulasi, dan claim fee.",
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
            Mengikuti{" "}
            <a
              className="text-lime-300 hover:underline"
              href="https://docs.bankr.bot/token-launching/overview"
              target="_blank"
              rel="noreferrer"
            >
              dokumentasi Bankr
            </a>
            . Supply tetap 100 miliar · tidak mintable setelah deploy.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
