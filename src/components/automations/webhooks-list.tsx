"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle2,
  Pencil,
  PlayCircle,
  Plus,
  Power,
  Trash2,
} from "lucide-react";

import {
  WEBHOOK_EVENT_LABEL,
  type Webhook,
  type WebhookEventName,
} from "@/domain/webhook";
import {
  useDeleteWebhook,
  useTestWebhook,
  useUpdateWebhook,
  useWebhooksList,
} from "@/application/hooks/useWebhooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRelative } from "@/lib/formatters";

import { WebhookFormDialog } from "./webhook-form-dialog";

type FormMode = { kind: "create" } | { kind: "edit"; webhook: Webhook };

export function WebhooksList() {
  const query = useWebhooksList();
  const update = useUpdateWebhook();
  const remove = useDeleteWebhook();
  const test = useTestWebhook();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>({ kind: "create" });

  const webhooks = query.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Webhooks de salida</CardTitle>
          <CardDescription>
            Cada evento que ocurra en los leads se propagará por HTTP a los
            endpoints habilitados (CRM, automations, data warehouse…).
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setFormMode({ kind: "create" });
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nuevo webhook
        </Button>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <Skeleton className="h-36 w-full" />
        ) : webhooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay webhooks. Crea uno para comenzar a enviar eventos a un
            sistema externo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Entregas</TableHead>
                  <TableHead>Última entrega</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{w.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {w.url}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {w.events.map((e) => (
                          <Badge
                            key={e}
                            variant="secondary"
                            className="font-mono text-[10px]"
                          >
                            {WEBHOOK_EVENT_LABEL[e as WebhookEventName] ?? e}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {w.enabled ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                        >
                          Activo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-muted text-muted-foreground"
                        >
                          Pausado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{w.deliveryCount} entregas</span>
                        <span className="text-xs text-muted-foreground">
                          {w.failureCount} fallos
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {w.lastDeliveryAt ? (
                        <div className="flex items-center gap-1.5">
                          {w.lastDeliveryStatus === "success" ? (
                            <CheckCircle2 className="size-3.5 text-emerald-500" />
                          ) : (
                            <Ban className="size-3.5 text-destructive" />
                          )}
                          <span>{formatRelative(w.lastDeliveryAt)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Probar"
                          title="Enviar evento de prueba"
                          disabled={test.isPending}
                          onClick={async () => {
                            try {
                              const res = await test.mutateAsync(w.id);
                              if (res.status === "success") {
                                toast.success(
                                  `Webhook entregado (${res.httpStatus ?? "ok"})`,
                                );
                              } else {
                                toast.error(
                                  `Fallo al entregar: ${res.message}`,
                                );
                              }
                            } catch (err) {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : "No se pudo probar el webhook",
                              );
                            }
                          }}
                        >
                          <PlayCircle className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={w.enabled ? "Pausar" : "Activar"}
                          title={w.enabled ? "Pausar" : "Activar"}
                          onClick={() =>
                            update
                              .mutateAsync({
                                id: w.id,
                                input: { enabled: !w.enabled },
                              })
                              .then(() =>
                                toast.success(
                                  w.enabled
                                    ? "Webhook pausado"
                                    : "Webhook activado",
                                ),
                              )
                              .catch((err) =>
                                toast.error(
                                  err instanceof Error
                                    ? err.message
                                    : "No se pudo actualizar",
                                ),
                              )
                          }
                        >
                          <Power className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Editar"
                          title="Editar"
                          onClick={() => {
                            setFormMode({ kind: "edit", webhook: w });
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Eliminar"
                          title="Eliminar"
                          onClick={() =>
                            remove
                              .mutateAsync(w.id)
                              .then(() => toast.success("Webhook eliminado"))
                              .catch((err) =>
                                toast.error(
                                  err instanceof Error
                                    ? err.message
                                    : "No se pudo eliminar",
                                ),
                              )
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <WebhookFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
      />
    </Card>
  );
}
