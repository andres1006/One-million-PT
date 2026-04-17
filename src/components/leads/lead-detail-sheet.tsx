"use client";

import { Mail, Phone, Tag, Wallet, Calendar } from "lucide-react";

import type { Lead } from "@/domain/lead";
import { LEAD_SOURCE_LABEL } from "@/domain/lead";
import { useLeadById } from "@/application/hooks/useLeads";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceBadge } from "./source-badge";
import { formatCurrency, formatDate, formatRelative } from "@/lib/formatters";

interface Props {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailSheet({ leadId, open, onOpenChange }: Props) {
  const { data: lead, isLoading, isError } = useLeadById(leadId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Detalle del lead</SheetTitle>
          <SheetDescription>
            Información completa y trazabilidad.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : isError || !lead ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No se pudo cargar el detalle.
            </p>
          ) : (
            <LeadDetailBody lead={lead} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LeadDetailBody({ lead }: { lead: Lead }) {
  return (
    <div className="flex flex-col gap-5 py-4">
      <header className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold tracking-tight">{lead.nombre}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source={lead.fuente} />
          <span className="text-xs text-muted-foreground">
            {formatRelative(lead.fecha_creacion)}
          </span>
        </div>
      </header>

      <dl className="grid grid-cols-1 gap-3 text-sm">
        <DetailRow icon={Mail} label="Email" value={lead.email} mono />
        <DetailRow
          icon={Phone}
          label="Teléfono"
          value={lead.telefono ?? "—"}
          mono={!!lead.telefono}
        />
        <DetailRow
          icon={Tag}
          label="Producto de interés"
          value={lead.producto_interes ?? "—"}
        />
        <DetailRow
          icon={Wallet}
          label="Presupuesto"
          value={formatCurrency(lead.presupuesto)}
        />
        <DetailRow
          icon={Calendar}
          label="Fuente"
          value={LEAD_SOURCE_LABEL[lead.fuente]}
        />
        <DetailRow
          icon={Calendar}
          label="Fecha de creación"
          value={formatDate(lead.fecha_creacion)}
        />
      </dl>

      <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-mono">id: {lead.id}</p>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd
          className={`truncate text-sm ${mono ? "font-mono" : "font-medium"}`}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
