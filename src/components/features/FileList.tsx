"use client";

import { useLocale } from "@/components/layout/LocaleProvider";

import { FileRow } from "./FileRow";
import { ConvertibleFile } from "@/lib/types";

interface FileListProps {
  files: ConvertibleFile[];
  disabled: boolean;
  onRemove: (id: string) => void;
  onFormatChange: (id: string, format: string) => void;
  onDownload: (id: string) => void;
}

export function FileList({ files, disabled, onRemove, onFormatChange, onDownload }: FileListProps) {
  const { t } = useLocale();
  if (files.length === 0) return null;

  return (
    <div role="list" aria-label={t("queue")} className="overflow-hidden rounded-lg border border-border bg-card">
      {files.map((file) => (
        <FileRow
          key={file.id}
          file={file}
          disabled={disabled}
          onRemove={onRemove}
          onFormatChange={onFormatChange}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}
