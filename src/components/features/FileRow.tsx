"use client";

import { useLocale } from "@/components/layout/LocaleProvider";

import { useState } from "react";
import { Printer, X, Download, Loader2, Check, AlertCircle, FileIcon, ImageIcon, FileText, Music, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FormatSelector } from "./FormatSelector";
import { DocumentPrintPreview } from "./DocumentPrintPreview";
import { ConvertibleFile, formatFileSize } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Translate } from "@/lib/i18n";

interface FileRowProps {
  file: ConvertibleFile;
  disabled: boolean;
  onRemove: (id: string) => void;
  onFormatChange: (id: string, format: string) => void;
  onDownload: (id: string) => void;
}

function getFileIcon(category: string) {
  switch (category) {
    case "image":
      return <ImageIcon aria-hidden className="h-5 w-5 text-primary" />;
    case "document":
      return <FileText className="h-5 w-5 text-primary" />;
    case "audio":
      return <Music className="h-5 w-5 text-primary" />;
    case "video":
      return <Video className="h-5 w-5 text-primary" />;
    default:
      return <FileIcon className="h-5 w-5 text-primary" />;
  }
}

function getStatusBadge(status: ConvertibleFile["status"], forPrint: boolean, t: Translate) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">{t("pending")}</Badge>;
    case "converting":
      return (
        <Badge className="bg-blue-100 text-blue-700">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          {t("converting")}
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-700">
          <Check className="mr-1 h-3 w-3" />
          {t(forPrint ? "readyToPrint" : "ready")}
        </Badge>
      );
    case "cancelled":
      return <Badge variant="outline">{t("cancelled")}</Badge>;
    case "error":
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" />
          {t("error")}
        </Badge>
      );
  }
}

export function FileRow({ file, disabled, onRemove, onFormatChange, onDownload }: FileRowProps) {
  const { t } = useLocale();
  const [printing, setPrinting] = useState(false);
  const result = file.result;

  return (
    <div
      role="listitem"
      aria-label={file.name}
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border p-3 transition-colors hover:bg-muted/50 sm:p-4"
      )}
    >
      {/* File info */}
      <div className="flex w-full min-w-0 items-center gap-3 md:w-auto md:flex-1">
        <div className="rounded-lg bg-muted p-2">
          {getFileIcon(file.category)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground" title={file.name}>{file.name}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            <span>{formatFileSize(file.size)}{result?.kind === "download" && ` → ${formatFileSize(result.blob.size)}`}</span>
            <span>•</span>
            <span className="uppercase">{file.sourceFormat}</span>
            {result?.kind === "download" && result.method === "copy" && <span>· {t("noReencoding")}</span>}
          </div>
          {file.category === "image" && file.options?.maxDimension && (
            <p className="text-xs text-muted-foreground">{t("maxSideRow", { size: file.options.maxDimension })}</p>
          )}
          {result?.kind === "download" && result.note && <p className="mt-1 text-xs text-muted-foreground">{t(result.note.key, result.note.params)}</p>}
          {file.status === "error" && <p className="mt-1 break-words text-sm text-destructive">{file.error && t(file.error.key, file.error.params)}</p>}
        </div>
      </div>

      {/* Format selector (hidden after conversion) */}
      {file.status !== "completed" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("to")}</span>
          <FormatSelector
            file={file}
            value={file.targetFormat}
            onChange={(format) => onFormatChange(file.id, format)}
            disabled={disabled}
          />
        </div>
      )}

      {/* Target format badge (shown after conversion) */}
      {file.status === "completed" && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="uppercase">{file.targetFormat}</Badge>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-3">
        {getStatusBadge(file.status, result?.kind === "print", t)}
      </div>

      {/* Progress bar (only when converting) */}
      {file.status === "converting" && (
        <div className="w-24">
          <Progress value={file.progress} aria-label={t("fileProgress", { name: file.name })} className="h-2" />
        </div>
      )}

      {/* Actions */}
      <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
        {result?.kind === "download" && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onDownload(file.id)}
            className="bg-[#22C55E] hover:bg-[#16A34A]"
          >
            <Download className="mr-1 h-4 w-4" />
            {t("download")}
          </Button>
        )}
        {result?.kind === "print" && (
          <>
            <Button size="sm" onClick={() => setPrinting(true)}>
              <Printer className="h-4 w-4" />
              {t("printPdf")}
            </Button>
            {printing && <DocumentPrintPreview html={result.html} title={result.title} onClose={() => setPrinting(false)} />}
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(file.id)}
          disabled={disabled}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t("removeFile", { name: file.name })}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
