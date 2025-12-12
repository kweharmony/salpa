"use client";

import { X, Download, Loader2, Check, AlertCircle, FileIcon, Image, FileText, Music, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FormatSelector } from "./FormatSelector";
import { ConvertibleFile, formatFileSize } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FileRowProps {
  file: ConvertibleFile;
  onRemove: (id: string) => void;
  onFormatChange: (id: string, format: string) => void;
  onDownload: (id: string) => void;
}

function getFileIcon(category: string) {
  switch (category) {
    case "image":
      return <Image className="h-5 w-5 text-primary" />;
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

function getStatusBadge(status: ConvertibleFile["status"]) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Ожидание</Badge>;
    case "converting":
      return (
        <Badge className="bg-blue-100 text-blue-700">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Конвертация
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-700">
          <Check className="mr-1 h-3 w-3" />
          Готово
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" />
          Ошибка
        </Badge>
      );
  }
}

export function FileRow({ file, onRemove, onFormatChange, onDownload }: FileRowProps) {
  const category = file.type.split("/")[0];

  return (
    <div
      className={cn(
        "group flex flex-col gap-3 border-b border-border p-4 transition-colors duration-150",
        "hover:bg-muted/50",
        "md:flex-row md:items-center"
      )}
    >
      {/* File info */}
      <div className="flex flex-1 items-center gap-3">
        <div className="rounded-lg bg-muted p-2">
          {getFileIcon(category)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{file.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span className="uppercase">{file.sourceFormat}</span>
          </div>
        </div>
      </div>

      {/* Format selector (hidden after conversion) */}
      {file.status !== "completed" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">в</span>
          <FormatSelector
            file={file}
            value={file.targetFormat}
            onChange={(format) => onFormatChange(file.id, format)}
            disabled={file.status === "converting"}
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
        {getStatusBadge(file.status)}
      </div>

      {/* Progress bar (only when converting) */}
      {file.status === "converting" && (
        <div className="w-24">
          <Progress value={file.progress} className="h-2" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {file.status === "completed" && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onDownload(file.id)}
            className="bg-[#22C55E] hover:bg-[#16A34A]"
          >
            <Download className="mr-1 h-4 w-4" />
            Скачать
          </Button>
        )}
        {file.status === "error" && (
          <p className="max-w-[150px] truncate text-sm text-destructive">
            {file.error || "Ошибка конвертации"}
          </p>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(file.id)}
          disabled={file.status === "converting"}
          className="opacity-50 transition-opacity group-hover:opacity-100"
          aria-label="Удалить файл"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
