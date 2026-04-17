"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/ai-summary", label: "Resumen IA", icon: Sparkles },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground"
      aria-label="Navegación principal"
    >
      <div className="flex h-14 items-center gap-2 border-b px-5 font-mono text-sm">
        <span className="h-6 w-6 rounded-md bg-foreground text-background grid place-items-center text-xs font-semibold">
          1M
        </span>
        <span className="tracking-tight">OMC · Leads</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">One Million Copy SAS</p>
        <p>Prueba técnica frontend</p>
      </div>
    </aside>
  );
}
