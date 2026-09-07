"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, History, Rocket, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletBar } from "@/components/wallet-bar";

const NAV = [
  { href: "/", label: "Deploy", icon: Rocket },
  { href: "/mint", label: "Mint", icon: Coins },
  { href: "/inspect", label: "Inspect", icon: Search },
  { href: "/riwayat", label: "Riwayat", icon: History },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07110c]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-lime-400 text-sm font-bold text-black">
              M
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">
                Manual Token Lab
              </span>
              <span className="block text-[11px] text-lime-200/70">
                Deploy & mint supply ke wallet tujuan
              </span>
            </span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/30 p-1 sm:mx-4 sm:justify-center">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                  active
                    ? "bg-lime-400 text-black"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <WalletBar />
      </div>
    </header>
  );
}
