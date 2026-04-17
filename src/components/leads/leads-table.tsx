"use client";

import { ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react";

import type { Lead, PaginatedLeads } from "@/domain/lead";
import { useLeadsFilters } from "@/application/stores/leads-filters-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { SourceBadge } from "./source-badge";
import { formatCurrency, formatRelative } from "@/lib/formatters";

interface Props {
  data: PaginatedLeads | undefined;
  isLoading: boolean;
  isError: boolean;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

export function LeadsTable({
  data,
  isLoading,
  isError,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const { sort, setSort } = useLeadsFilters();
  const rows = data?.data ?? [];

  const toggleSort = () =>
    setSort(sort === "fecha_desc" ? "fecha_asc" : "fecha_desc");

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
        Ocurrió un error al cargar los leads. Intenta refrescar la página.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Fuente</TableHead>
            <TableHead className="hidden md:table-cell">Producto</TableHead>
            <TableHead className="text-right">Presupuesto</TableHead>
            <TableHead className="w-[170px]">
              <button
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={toggleSort}
                aria-label="Ordenar por fecha"
              >
                Fecha <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
            <TableHead className="w-[120px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && rows.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((lead) => (
                <TableRow key={lead.id} className="group">
                  <TableCell className="font-medium">{lead.nombre}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {lead.email}
                  </TableCell>
                  <TableCell>
                    <SourceBadge source={lead.fuente} />
                  </TableCell>
                  <TableCell className="hidden max-w-[220px] truncate text-muted-foreground md:table-cell">
                    {lead.producto_interes ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(lead.presupuesto)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatRelative(lead.fecha_creacion)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Ver ${lead.nombre}`}
                        onClick={() => onView(lead)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${lead.nombre}`}
                        onClick={() => onEdit(lead)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Eliminar ${lead.nombre}`}
                        onClick={() => onDelete(lead)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          {!isLoading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="p-0">
                <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
                  <p className="text-sm font-medium">
                    No hay leads que coincidan
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ajusta los filtros o crea un nuevo lead.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
