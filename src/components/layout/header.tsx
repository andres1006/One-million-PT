import { ThemeToggle } from "./theme-toggle";

export function Header({ title }: { title: string }) {
  return (
    <header
      role="banner"
      className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 md:px-6"
    >
      <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
        {title}
      </h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
