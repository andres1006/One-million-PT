"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import type { Lead, LeadSource } from "@/domain/lead";
import { LEAD_SOURCES, LEAD_SOURCE_LABEL } from "@/domain/lead";
import {
  leadCreateSchema,
  type LeadCreateInput,
} from "@/domain/lead.schema";
import {
  useCreateLead,
  useUpdateLead,
} from "@/application/hooks/useLeads";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Mode = { kind: "create" } | { kind: "edit"; lead: Lead };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
}

function leadToDefaults(lead?: Lead): LeadCreateInput {
  return {
    nombre: lead?.nombre ?? "",
    email: lead?.email ?? "",
    telefono: lead?.telefono ?? "",
    fuente: (lead?.fuente ?? "instagram") as LeadSource,
    producto_interes: lead?.producto_interes ?? "",
    presupuesto: lead?.presupuesto,
  };
}

export function LeadFormDialog({ open, onOpenChange, mode }: Props) {
  const createMut = useCreateLead();
  const updateMut = useUpdateLead();

  const form = useForm<LeadCreateInput>({
    resolver: zodResolver(leadCreateSchema),
    defaultValues: leadToDefaults(
      mode.kind === "edit" ? mode.lead : undefined,
    ),
  });

  useEffect(() => {
    if (open) {
      form.reset(
        leadToDefaults(mode.kind === "edit" ? mode.lead : undefined),
      );
    }
  }, [open, mode, form]);

  const isEdit = mode.kind === "edit";
  const submitting = createMut.isPending || updateMut.isPending;

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: mode.lead.id, input: data });
        toast.success("Lead actualizado");
      } else {
        await createMut.mutateAsync(data);
        toast.success("Lead creado");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar el lead",
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar lead" : "Nuevo lead"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos del lead. Los cambios se guardan al enviar."
              : "Completa el formulario para registrar un nuevo lead."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={onSubmit}
            className="grid gap-4"
            id="lead-form"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. María González"
                        autoComplete="name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="lead@empresa.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+57 300 000 0000"
                        autoComplete="tel"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fuente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuente *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona una fuente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAD_SOURCES.map((src) => (
                          <SelectItem key={src} value={src}>
                            {LEAD_SOURCE_LABEL[src]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="producto_interes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto de interés</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Ej. Curso de copywriting, mentoría 1:1…"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="presupuesto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Presupuesto (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      placeholder="0"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>Opcional, solo números.</FormDescription>
                  <FormMessage />
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
          >
            Cancelar
          </Button>
          <Button type="submit" form="lead-form" disabled={submitting}>
            {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
