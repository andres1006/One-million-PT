"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { useLeadsFilters } from "@/application/stores/leads-filters-store";
import { Button } from "@/components/ui/button";

interface Props {
  total: number | undefined;
}

export function LeadsPagination({ total }: Props) {
  const { page, pageSize, setPage } = useLeadsFilters();
  const safeTotal = total ?? 0;
  const totalPages = Math.max(1, Math.ceil(safeTotal / pageSize));
  // When there's nothing to show (loading or empty) the range collapses to 0–0
  // instead of the misleading "1–0" we produced before.
  const from = safeTotal === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, safeTotal);

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <p>
        Mostrando{" "}
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>{" "}
        de{" "}
        <span className="font-medium text-foreground">{total ?? 0}</span> leads
      </p>
      <div className="flex items-center gap-2">
        <span className="font-mono">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
