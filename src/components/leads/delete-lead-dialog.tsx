"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { Lead } from "@/domain/lead";
import { useDeleteLead } from "@/application/hooks/useLeads";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteLeadDialog({ lead, open, onOpenChange }: Props) {
  const deleteMut = useDeleteLead();

  const onConfirm = async () => {
    if (!lead) return;
    try {
      await deleteMut.mutateAsync(lead.id);
      toast.success(`Lead "${lead.nombre}" eliminado`);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar el lead",
      );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>¿Eliminar este lead?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará permanentemente a{" "}
            <strong>{lead?.nombre ?? "este lead"}</strong>. Esta acción no se
            puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={deleteMut.isPending}
          >
            {deleteMut.isPending ? "Eliminando…" : "Eliminar lead"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
