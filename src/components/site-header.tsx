"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, Coins, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Deploy", icon: Rocket },
  { href: "/launches", label: "Launch terbaru", icon: Coins },
  { href: "/fees", label: "Fee & claim", icon: Wallet },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07110c]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-lime-400 text-sm font-bold text-black">
            B
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">
              Bankr Launchpad
            </span>
            <span className="block text-[11px] text-lime-200/70">
              Deploy token · mint ke wallet tujuan
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
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
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                  active
                    ? "bg-lime-400 text-black"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
