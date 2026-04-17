import type { LeadSource } from "@/domain/lead";
import { LEAD_SOURCE_LABEL } from "@/domain/lead";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<LeadSource, string> = {
  instagram:
    "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-900/50 dark:bg-pink-950/40 dark:text-pink-300",
  facebook:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
  landing_page:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  referido:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
  otro:
    "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300",
};

export function SourceBadge({ source }: { source: LeadSource }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[source])}>
      {LEAD_SOURCE_LABEL[source]}
    </Badge>
  );
}
