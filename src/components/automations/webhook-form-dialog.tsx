"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_LABEL,
  type Webhook,
  type WebhookEventName,
} from "@/domain/webhook";
import {
  webhookCreateSchema,
  type WebhookCreateFormValues,
  type WebhookCreateInput,
} from "@/domain/webhook.schema";
import {
  useCreateWebhook,
  useUpdateWebhook,
} from "@/application/hooks/useWebhooks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type Mode = { kind: "create" } | { kind: "edit"; webhook: Webhook };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
}

function webhookToDefaults(w?: Webhook): WebhookCreateFormValues {
  return {
    name: w?.name ?? "",
    url: w?.url ?? "",
    events: (w?.events as WebhookEventName[]) ?? ["lead.created"],
    enabled: w?.enabled ?? true,
    secret: w?.secret ?? "",
  };
}

export function WebhookFormDialog({ open, onOpenChange, mode }: Props) {
  const createMut = useCreateWebhook();
  const updateMut = useUpdateWebhook();

  const form = useForm<WebhookCreateFormValues, unknown, WebhookCreateInput>({
    resolver: zodResolver(webhookCreateSchema),
    defaultValues: webhookToDefaults(
      mode.kind === "edit" ? mode.webhook : undefined,
    ),
  });

  useEffect(() => {
    if (open) {
      form.reset(
        webhookToDefaults(mode.kind === "edit" ? mode.webhook : undefined),
      );
    }
  }, [open, mode, form]);

  const isEdit = mode.kind === "edit";
  const submitting = createMut.isPending || updateMut.isPending;

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: mode.webhook.id, input: data });
        toast.success("Webhook actualizado");
      } else {
        await createMut.mutateAsync(data);
        toast.success("Webhook creado");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el webhook",
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar webhook" : "Nuevo webhook de salida"}
          </DialogTitle>
          <DialogDescription>
            Cada vez que ocurra uno de los eventos seleccionados, la app hará
            POST al endpoint indicado con el payload del lead.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={onSubmit}
            className="grid gap-4"
            id="webhook-form"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. HubSpot — pipeline principal"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://hooks.example.com/…"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Debe ser una URL absoluta accesible desde el servidor.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="events"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eventos *</FormLabel>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {WEBHOOK_EVENTS.map((event) => {
                      const checked = field.value?.includes(event) ?? false;
                      return (
                        <label
                          key={event}
                          className="flex cursor-pointer items-start gap-2 rounded-md border border-border/60 p-2 text-sm hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              const current = new Set(field.value ?? []);
                              if (next) current.add(event);
                              else current.delete(event);
                              field.onChange(Array.from(current));
                            }}
                          />
                          <span className="flex flex-col">
                            <span className="font-medium">
                              {WEBHOOK_EVENT_LABEL[event]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {event}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret opcional</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Se envía en la cabecera x-omc-signature"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    El consumidor puede validar la firma para ignorar
                    llamadas no autorizadas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 p-2 text-sm hover:bg-muted/40">
                    <Checkbox
                      checked={field.value ?? true}
                      onCheckedChange={(next) => field.onChange(Boolean(next))}
                    />
                    <span className="flex flex-col">
                      <span className="font-medium">Activo</span>
                      <span className="text-xs text-muted-foreground">
                        Si lo desactivas, dejará de recibir eventos sin
                        eliminar la configuración.
                      </span>
                    </span>
                  </label>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="webhook-form"
            disabled={submitting}
          >
            {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
