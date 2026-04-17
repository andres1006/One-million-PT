"use client";

import { Search, X, Plus } from "lucide-react";

import { LEAD_SOURCES, LEAD_SOURCE_LABEL } from "@/domain/lead";
import { useLeadsFilters } from "@/application/stores/leads-filters-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Props {
  onCreate: () => void;
}

export function LeadFiltersBar({ onCreate }: Props) {
  const { q, source, from, to, setQ, setSource, setDateRange, reset } =
    useLeadsFilters();

  const hasFilters =
    Boolean(q) || source !== "all" || Boolean(from) || Boolean(to);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="pl-8"
            aria-label="Buscar leads"
          />
        </div>

        <Select
          value={source}
          onValueChange={(v) => setSource(v as typeof source)}
        >
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Fuente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fuentes</SelectItem>
            {LEAD_SOURCES.map((src) => (
              <SelectItem key={src} value={src}>
                {LEAD_SOURCE_LABEL[src]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={from ?? ""}
            onChange={(e) => setDateRange(e.target.value || null, to)}
            className="w-full md:w-36"
            aria-label="Fecha desde"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            type="date"
            value={to ?? ""}
            onChange={(e) => setDateRange(from, e.target.value || null)}
            className="w-full md:w-36"
            aria-label="Fecha hasta"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className={cn(!hasFilters && "pointer-events-none opacity-0")}
          aria-label="Limpiar filtros"
        >
          <X className="mr-1 h-3.5 w-3.5" /> Limpiar
        </Button>
      </div>

      <Button onClick={onCreate} size="sm">
        <Plus className="mr-1 h-4 w-4" /> Nuevo lead
      </Button>
    </div>
  );
}
