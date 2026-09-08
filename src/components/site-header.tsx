"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WalletBar } from "@/components/wallet-bar";

const NAV = [
  { href: "/", label: "Launch" },
  { href: "/claim", label: "Claim" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex size-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold"
          >
            B
          </Link>
          <nav className="flex items-center gap-4">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm transition-colors",
                    active ? "text-white" : "text-zinc-500 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <WalletBar />
      </div>
    </header>
  );
}
