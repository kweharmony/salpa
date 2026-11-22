"use client";

import { useLocale } from "@/components/layout/LocaleProvider";

import { Play, Trash2, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ConvertibleFile } from "@/lib/types";

interface ConversionPanelProps {
  files: ConvertibleFile[];
  onConvertAll: () => void;
  onRetry: () => void;
  onClearAll: () => void;
  onDownloadAll: () => void;
  onCancel: () => void;
  phase: "idle" | "checking" | "confirming" | "converting";
  overallProgress: number;
  archiving: boolean;
}

export function ConversionPanel({
  files, onConvertAll, onRetry, onClearAll, onDownloadAll, onCancel,
  phase, overallProgress, archiving,
}: ConversionPanelProps) {
  const { t } = useLocale();
  if (!files.length) return null;

  const pending = files.filter(({ status }) => status === "pending" || status === "cancelled").length;
  const completed = files.filter(({ status }) => status === "completed").length;
  const downloadable = files.some(({ result }) => result?.kind === "download");
  const failed = files.filter(({ status }) => status === "error").length;
  const idle = phase === "idle";

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p role="status">
          {t("completedCount", { done: completed, total: files.length })}
          {failed > 0 && <span className="ml-3 text-destructive">{t("failedCount", { count: failed })}</span>}
        </p>
        {phase === "checking" && <span>{t("checkingMedia")}</span>}
        {phase === "converting" && <span>{t("conversionPercent", { percent: Math.round(overallProgress) })}</span>}
      </div>
      {phase === "converting" && <Progress value={overallProgress} aria-label={t("queueProgress")} />}
      <div className="flex flex-wrap items-center gap-2">
        {idle && pending > 0 && (
          <Button onClick={onConvertAll}>
            <Play className="h-4 w-4" />
            {t("convert")}{pending > 1 ? ` (${pending})` : ""}
          </Button>
        )}
        {idle && failed > 0 && (
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" />
            {t("retry", { count: failed })}
          </Button>
        )}
        {(phase === "checking" || phase === "converting") && (
          <Button variant="outline" onClick={onCancel}>{t("stop")}</Button>
        )}
        {downloadable && (
          <Button variant="secondary" onClick={onDownloadAll} disabled={archiving} className="h-auto min-h-9 max-w-full whitespace-normal">
            <Download className="h-4 w-4" />
            {t(archiving ? "zipping" : "downloadZip")}
          </Button>
        )}
        <Button variant="ghost" onClick={onClearAll} disabled={!idle || archiving}>
          <Trash2 className="h-4 w-4" />
          {t("clear")}
        </Button>
      </div>
    </div>
  );
}
