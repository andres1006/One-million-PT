import { ThemeToggle } from "./theme-toggle";

export function Header({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/80 px-4 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20">
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
