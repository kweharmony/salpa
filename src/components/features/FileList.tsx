"use client";

import { FileRow } from "./FileRow";
import { ConvertibleFile } from "@/lib/types";
import { FileX } from "lucide-react";

interface FileListProps {
  files: ConvertibleFile[];
  onRemove: (id: string) => void;
  onFormatChange: (id: string, format: string) => void;
  onDownload: (id: string) => void;
}

export function FileList({ files, onRemove, onFormatChange, onDownload }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <FileX className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">Нет загруженных файлов</p>
        <p className="text-sm text-muted-foreground">
          Начните с загрузки файлов в зону выше
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {files.map((file) => (
        <FileRow
          key={file.id}
          file={file}
          onRemove={onRemove}
          onFormatChange={onFormatChange}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}
