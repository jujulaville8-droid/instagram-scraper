"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/leads", label: "LEADS", icon: "◎", count: null },
  { href: "/hashtags", label: "HASHTAGS", icon: "#", count: null },
  { href: "/campaigns", label: "CAMPAIGNS", icon: "▣", count: null },
  { href: "/drafts", label: "DRAFTS", icon: "✉", count: null },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-emerald-500/10 bg-[#080b10]/95 backdrop-blur-sm">
      {/* Logo area */}
      <div className="relative px-6 py-7">
        <div className="flex items-center gap-3">
          {/* Animated pulse dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          </span>
          <span className="font-[family-name:var(--font-jetbrains)] text-[13px] font-semibold tracking-[0.25em] text-emerald-400">
            INSTALEAD
          </span>
        </div>
        <div className="mt-1.5 pl-[22px] font-[family-name:var(--font-jetbrains)] text-[9px] tracking-[0.2em] text-zinc-600">
          TARGET ACQUISITION v0.1
        </div>
        {/* Scan line */}
        <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-emerald-500/30 via-emerald-500/10 to-transparent" />
      </div>

      {/* System status */}
      <div className="mx-6 mb-4 flex items-center gap-2 rounded border border-emerald-500/10 bg-emerald-500/[0.03] px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
        <span className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.15em] text-emerald-500/70">
          System Online
        </span>
      </div>

      {/* Nav section label */}
      <div className="px-6 pb-2">
        <span className="font-[family-name:var(--font-jetbrains)] text-[8px] font-medium uppercase tracking-[0.3em] text-zinc-700">
          Navigation
        </span>
      </div>

      {/* Nav items */}
      <ul className="flex flex-1 flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500/[0.08] text-emerald-400"
                    : "text-zinc-500 hover:bg-zinc-800/30 hover:text-zinc-300"
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                )}
                {/* Icon */}
                <span className={`font-[family-name:var(--font-jetbrains)] text-[13px] ${isActive ? 'text-emerald-500' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                  {item.icon}
                </span>
                {/* Label */}
                <span className="font-[family-name:var(--font-jetbrains)] text-[10px] font-medium tracking-[0.2em]">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="border-t border-emerald-500/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-jetbrains)] text-[8px] uppercase tracking-[0.2em] text-zinc-700">
            Local Scraper
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
            <span className="font-[family-name:var(--font-jetbrains)] text-[8px] uppercase tracking-[0.15em] text-zinc-600">
              Idle
            </span>
          </span>
        </div>
      </div>
    </nav>
  );
}
