import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <span
        aria-hidden
        className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground"
      >
        <Compass className="h-6 w-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">
        Página no encontrada
      </h1>
      <p className="text-sm text-muted-foreground">
        La ruta que intentas abrir no existe o fue movida.
      </p>
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "default", size: "sm" }))}
      >
        <ArrowLeft className="mr-1 h-3.5 w-3.5" />
        Volver al dashboard
      </Link>
    </div>
  );
}
