import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Skip-to-content anchor — invisible unless keyboard-focused. */}
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 focus-visible:outline-none md:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
