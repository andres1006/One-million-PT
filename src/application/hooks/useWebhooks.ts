"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type {
  WebhookCreateInput,
  WebhookUpdateInput,
} from "@/domain/webhook.schema";
import { httpWebhooksRepository } from "@/infrastructure/api/webhooksRepository.http";

const repo = httpWebhooksRepository;

export const webhookQueryKeys = {
  all: ["webhooks"] as const,
  list: () => ["webhooks", "list"] as const,
  events: (limit: number) => ["webhooks", "events", limit] as const,
};

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: webhookQueryKeys.all });
}

export function useWebhooksList() {
  return useQuery({
    queryKey: webhookQueryKeys.list(),
    queryFn: () => repo.list(),
  });
}

/**
 * Polls the delivery log every 5s so successful tests / inbound captures
 * show up in the log without the user having to refresh manually.
 */
export function useWebhookEvents(limit = 50) {
  return useQuery({
    queryKey: webhookQueryKeys.events(limit),
    queryFn: () => repo.events(limit),
    refetchInterval: 5000,
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WebhookCreateInput) => repo.create(input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WebhookUpdateInput }) =>
      repo.update(id, input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.remove(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useTestWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.test(id),
    onSuccess: () => invalidateAll(qc),
  });
}
