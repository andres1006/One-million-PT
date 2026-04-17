"use client";

import { PanelLeft } from "lucide-react";

import { ThemeToggle } from "./theme-toggle";
import { useUiStore } from "@/application/stores/ui-store";

export function Header({ title }: { title: string }) {
  const toggle = useUiStore((s) => s.toggleSidebar);

  return (
    <header
      role="banner"
      className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 md:px-6"
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="Alternar sidebar"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background/40 text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:hidden"
        >
          <PanelLeft className="h-4 w-4" aria-hidden />
        </button>
        <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
