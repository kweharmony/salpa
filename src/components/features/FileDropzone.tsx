"use client";

import { useCallback, useState } from "react";
import { Upload, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

export function FileDropzone({ onFilesAdded, disabled = false }: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [disabled, onFilesAdded]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesAdded(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  }, [onFilesAdded]);

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all duration-250",
        "flex flex-col items-center justify-center p-8 md:p-12",
        "cursor-pointer",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary hover:bg-muted/50",
        disabled && "cursor-not-allowed opacity-50"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => !disabled && document.getElementById("file-input")?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Зона для загрузки файлов"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) {
            document.getElementById("file-input")?.click();
          }
        }
      }}
    >
      <input
        id="file-input"
        type="file"
        multiple
        className="sr-only"
        onChange={handleFileInput}
        disabled={disabled}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp,image/x-icon,image/tiff,.ico,.tiff,.tif,.avif,.txt,.md,.csv,.json,.html,.xml,.yaml,.yml,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/flac,audio/aac,.mp3,.wav,.ogg,.flac,.aac,.m4a,.wma,video/mp4,video/webm,video/x-msvideo,video/quicktime,image/gif,.mp4,.webm,.avi,.mov,.mkv,.gif,.flv,.wmv,.3gp"
      />

      <div className={cn(
        "mb-4 rounded-full p-4 transition-colors duration-250",
        isDragActive ? "bg-primary/10" : "bg-muted"
      )}>
        {isDragActive ? (
          <FileIcon className="h-10 w-10 text-primary" />
        ) : (
          <Upload className="h-10 w-10 text-muted-foreground" />
        )}
      </div>

      <p className="mb-2 text-lg font-medium text-foreground">
        {isDragActive
          ? "Отпустите файлы"
          : "Перетащите файлы или нажмите для выбора"}
      </p>
      <p className="text-sm text-muted-foreground">
        Изображения, документы, аудио и видео файлы
      </p>
    </div>
  );
}
