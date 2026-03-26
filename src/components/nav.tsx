"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/leads", label: "LEADS" },
  { href: "/hashtags", label: "HASHTAGS" },
  { href: "/campaigns", label: "CAMPAIGNS" },
  { href: "/drafts", label: "DRAFTS" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-6">
        <span className="inline-block h-2 w-2 bg-emerald-500" />
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
          Instalead
        </span>
      </div>

      {/* Nav items */}
      <ul className="flex flex-1 flex-col gap-0.5 px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative flex items-center px-3 py-2 text-[11px] font-medium uppercase tracking-[0.15em] transition-colors ${
                  isActive
                    ? "border-l-2 border-emerald-500 text-emerald-400"
                    : "border-l-2 border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-5 py-4">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600">
          v0.1
        </span>
      </div>
    </nav>
  );
}
