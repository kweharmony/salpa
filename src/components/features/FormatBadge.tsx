"use client";

import { toast } from "sonner";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Badge } from "@/components/ui/badge";
import { getFormatInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

const categoryColors = {
  image: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  document: "bg-green-100 text-green-700 hover:bg-green-200",
  audio: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  video: "bg-orange-100 text-orange-700 hover:bg-orange-200",
};

export function FormatBadge({ format }: { format: string }) {
  const { t } = useLocale();
  const label = format.toUpperCase();
  const category = getFormatInfo(format)?.category;
  const copyLabel = t("copyFormat", { value: label });

  async function copy() {
    try {
      await navigator.clipboard.writeText(label);
      toast.success(t("copied", { value: label }));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <Badge asChild variant="secondary" className={cn("cursor-pointer", category && categoryColors[category])}>
      <button type="button" aria-label={copyLabel} title={copyLabel} onClick={copy}>
        {label}
      </button>
    </Badge>
  );
}
