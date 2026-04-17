"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

import type { LeadFilters } from "@/domain/lead";
import type {
  LeadCreateInput,
  LeadUpdateInput,
} from "@/domain/lead.schema";
import { httpLeadsRepository } from "@/infrastructure/api/leadsRepository.http";

const repo = httpLeadsRepository;

const keys = {
  all: ["leads"] as const,
  list: (filters: LeadFilters) => ["leads", "list", filters] as const,
  detail: (id: string) => ["leads", "detail", id] as const,
  stats: () => ["leads", "stats"] as const,
};

export function useLeadsList(filters: LeadFilters) {
  return useQuery({
    queryKey: keys.list(filters),
    queryFn: () => repo.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useLeadStats() {
  return useQuery({
    queryKey: keys.stats(),
    queryFn: () => repo.stats(),
  });
}

export function useLeadById(id: string | null) {
  return useQuery({
    queryKey: keys.detail(id ?? ""),
    queryFn: () => repo.getById(id as string),
    enabled: Boolean(id),
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: keys.all });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadCreateInput) => repo.create(input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LeadUpdateInput }) =>
      repo.update(id, input),
    onSuccess: (_data, variables) => {
      invalidateAll(qc);
      qc.invalidateQueries({ queryKey: keys.detail(variables.id) });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.remove(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export const leadQueryKeys = keys;
