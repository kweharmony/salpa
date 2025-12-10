"use client";

import { Play, Trash2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConvertibleFile } from "@/lib/types";

interface ConversionPanelProps {
  files: ConvertibleFile[];
  onConvertAll: () => void;
  onClearAll: () => void;
  onDownloadAll: () => void;
  isConverting: boolean;
  overallProgress: number;
}

export function ConversionPanel({
  files,
  onConvertAll,
  onClearAll,
  onDownloadAll,
  isConverting,
  overallProgress,
}: ConversionPanelProps) {
  const pendingFiles = files.filter((f) => f.status === "pending").length;
  const completedFiles = files.filter((f) => f.status === "completed").length;
  const hasFiles = files.length > 0;
  const allCompleted = files.length > 0 && completedFiles === files.length;
  const canConvert = pendingFiles > 0 && !isConverting;

  if (!hasFiles) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{files.length}</span> файл
          {files.length === 1 ? "" : files.length < 5 ? "а" : "ов"}
        </div>
        {completedFiles > 0 && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-[#22C55E]">{completedFiles}</span>{" "}
            готов{completedFiles === 1 ? "" : completedFiles < 5 ? "о" : "о"}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isConverting && (
        <div className="flex flex-1 items-center gap-3 md:mx-4">
          <Progress value={overallProgress} className="h-2 flex-1" />
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(overallProgress)}%
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {allCompleted && (
          <Button
            variant="default"
            onClick={onDownloadAll}
            className="bg-[#22C55E] hover:bg-[#16A34A]"
          >
            <Download className="mr-2 h-4 w-4" />
            Скачать всё
          </Button>
        )}

        {canConvert && (
          <Button variant="default" onClick={onConvertAll}>
            <Play className="mr-2 h-4 w-4" />
            Конвертировать
            {pendingFiles > 1 && ` (${pendingFiles})`}
          </Button>
        )}

        {isConverting && (
          <Button variant="secondary" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Конвертация...
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={onClearAll}
          disabled={isConverting}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Очистить
        </Button>
      </div>
    </div>
  );
}
