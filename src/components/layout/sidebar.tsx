"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Sparkles,
  Users,
  Webhook,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useUiStore } from "@/application/stores/ui-store";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: readonly NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/ai-summary", label: "Resumen IA", icon: Sparkles },
  { href: "/automations", label: "Automatizaciones", icon: Webhook },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  // Keyboard shortcut: Ctrl+B / ⌘+B to toggle the sidebar. Attached once.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <>
      <aside
        data-collapsed={collapsed ? "true" : "false"}
        className={cn(
          "glass-surface sticky top-0 z-30 hidden h-screen shrink-0 flex-col",
          "transition-[width] duration-300 ease-out motion-reduce:transition-none",
          "md:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
        aria-label="Navegación principal"
      >
        {/* Brand row */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border/60 px-3",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 font-semibold tracking-tight",
              collapsed && "justify-center",
            )}
            aria-label="Ir al dashboard"
          >
            <span className="accent-gradient grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-white shadow-md ring-1 ring-white/20">
              1M
            </span>
            {!collapsed && (
              <span className="flex flex-col leading-tight">
                <span className="text-sm">OMC · Leads</span>
                <span className="text-[10px] font-normal uppercase tracking-[0.18em] text-muted-foreground">
                  Control Panel
                </span>
              </span>
            )}
          </Link>
          {!collapsed && <CollapseToggle collapsed={collapsed} onClick={toggle} />}
        </div>

        {/* Nav */}
        <nav
          className={cn("flex flex-col gap-1 px-2 py-4", collapsed && "items-center")}
          aria-label="Secciones principales"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href)
              }
            />
          ))}
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "mt-auto border-t border-sidebar-border/60 p-3 text-xs",
            collapsed && "flex flex-col items-center gap-2",
          )}
        >
          {collapsed ? (
            <CollapseToggle collapsed={collapsed} onClick={toggle} />
          ) : (
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">One Million Copy SAS</p>
              <p className="text-muted-foreground">Prueba técnica frontend</p>
              <p className="mt-1 text-[10px] text-muted-foreground/80">
                <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                  Ctrl
                </kbd>
                {" + "}
                <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                  B
                </kbd>
                {" para colapsar"}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function CollapseToggle({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = collapsed ? ChevronsRight : ChevronsLeft;
  const label = collapsed ? "Expandir sidebar" : "Colapsar sidebar";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={!collapsed}
      title={`${label} (Ctrl+B)`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-sidebar-border/60 bg-sidebar/60 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}

function NavLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      // Native browser tooltip — covers the collapsed-sidebar UX without
      // introducing Tooltip primitive complexity / asChild wrappers.
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-md text-sm transition-all",
        collapsed ? "w-10 justify-center" : "w-full px-3",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground ring-glow"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      {active && !collapsed && (
        <span
          aria-hidden
          className="accent-gradient absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full"
        />
      )}
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}
