"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { Lead } from "@/domain/lead";
import { useLeadsList } from "@/application/hooks/useLeads";
import { useLeadsFilters } from "@/application/stores/leads-filters-store";

import { LeadFiltersBar } from "./lead-filters-bar";
import { LeadsTable } from "./leads-table";
import { LeadsPagination } from "./leads-pagination";
import { LeadFormDialog } from "./lead-form-dialog";
import { LeadDetailSheet } from "./lead-detail-sheet";
import { DeleteLeadDialog } from "./delete-lead-dialog";

type FormState =
  | { open: false }
  | { open: true; mode: { kind: "create" } | { kind: "edit"; lead: Lead } };

export function LeadsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useLeadsFilters();

  // One-time hydration from the URL — scheduled in an effect so we don't mutate
  // the store during render. The ref prevents StrictMode double-runs from
  // re-hydrating and clobbering user edits.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    useLeadsFilters
      .getState()
      .hydrateFromParams(new URLSearchParams(searchParams.toString()));
  }, [searchParams]);

  // Sync filters → URL (shallow replace, avoids navigation history spam)
  const lastSynced = useRef<string>("");
  useEffect(() => {
    if (!hydratedRef.current) return;
    const next = filters.toSearchParams().toString();
    if (next === lastSynced.current) return;
    lastSynced.current = next;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [
    filters,
    filters.q,
    filters.source,
    filters.from,
    filters.to,
    filters.page,
    filters.sort,
    pathname,
    router,
  ]);

  const query = useLeadsList(filters.toQueryFilters());

  const [formState, setFormState] = useState<FormState>({ open: false });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  const onView = (lead: Lead) => {
    setDetailId(lead.id);
    setDetailOpen(true);
  };
  const onEdit = (lead: Lead) =>
    setFormState({ open: true, mode: { kind: "edit", lead } });
  const onDelete = (lead: Lead) => setDeleteTarget(lead);

  return (
    <div className="flex flex-col gap-4">
      <LeadFiltersBar
        onCreate={() =>
          setFormState({ open: true, mode: { kind: "create" } })
        }
      />

      <LeadsTable
        data={query.data}
        isLoading={query.isLoading}
        isError={query.isError}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <LeadsPagination total={query.data?.total} />

      {formState.open && (
        <LeadFormDialog
          open={formState.open}
          onOpenChange={(open) =>
            setFormState(open ? formState : { open: false })
          }
          mode={formState.mode}
        />
      )}

      <LeadDetailSheet
        leadId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <DeleteLeadDialog
        lead={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  );
}
