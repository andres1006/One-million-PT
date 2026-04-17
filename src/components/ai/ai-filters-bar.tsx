"use client";

import { Sparkles } from "lucide-react";

import { LEAD_SOURCES, LEAD_SOURCE_LABEL, type LeadSource } from "@/domain/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  source: LeadSource | "all";
  from: string | null;
  to: string | null;
  onChange: (next: {
    source: LeadSource | "all";
    from: string | null;
    to: string | null;
  }) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function AiFiltersBar({
  source,
  from,
  to,
  onChange,
  onGenerate,
  isGenerating,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label
            htmlFor="ai-source"
            className="text-xs font-medium text-muted-foreground"
          >
            Fuente
          </label>
          <Select
            value={source}
            onValueChange={(v) =>
              onChange({ source: v as LeadSource | "all", from, to })
            }
          >
            <SelectTrigger id="ai-source" className="w-full md:w-56">
              <SelectValue />
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
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="ai-from"
            className="text-xs font-medium text-muted-foreground"
          >
            Desde
          </label>
          <Input
            id="ai-from"
            type="date"
            value={from ?? ""}
            onChange={(e) =>
              onChange({ source, from: e.target.value || null, to })
            }
            className="w-full md:w-40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="ai-to"
            className="text-xs font-medium text-muted-foreground"
          >
            Hasta
          </label>
          <Input
            id="ai-to"
            type="date"
            value={to ?? ""}
            onChange={(e) =>
              onChange({ source, from, to: e.target.value || null })
            }
            className="w-full md:w-40"
          />
        </div>
      </div>

      <Button
        size="sm"
        onClick={onGenerate}
        disabled={isGenerating}
        className="md:self-end"
      >
        <Sparkles className="mr-1 h-4 w-4" />
        {isGenerating ? "Generando…" : "Generar resumen"}
      </Button>
    </div>
  );
}
