"use client";

import { AlertOctagon, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteError({ error, reset }: Props) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <span
        aria-hidden
        className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive"
      >
        <AlertOctagon className="h-6 w-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">
        Algo salió mal
      </h1>
      <p className="text-sm text-muted-foreground">
        Ocurrió un error al renderizar esta sección. Puedes reintentar sin
        recargar la página.
      </p>
      {error.digest && (
        <code className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
          digest: {error.digest}
        </code>
      )}
      <Button onClick={reset} variant="default" size="sm">
        <RotateCcw className="mr-1 h-3.5 w-3.5" />
        Reintentar
      </Button>
    </div>
  );
}
