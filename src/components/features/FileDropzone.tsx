"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { FileIcon, Upload } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { FILE_ACCEPT } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

export function FileDropzone({ onFilesAdded, disabled = false }: FileDropzoneProps) {
  const { t } = useLocale();
  const input = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const description = useId();
  const [isDragging, setDragging] = useState(false);
  const isDragActive = isDragging && !disabled;

  function handleDragEnter(event: DragEvent) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    dragDepth.current++;
    if (!disabled) setDragging(true);
  }

  function handleDragLeave() {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (disabled) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length) onFilesAdded(files);
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? "none" : "copy";
      }}
      onDrop={handleDrop}
    >
      <input
        ref={input}
        id="file-input"
        type="file"
        multiple
        hidden
        disabled={disabled}
        accept={FILE_ACCEPT}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (!disabled && files.length) onFilesAdded(files);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={t("uploadArea")}
        aria-describedby={description}
        onClick={() => input.current?.click()}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:py-10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border enabled:hover:border-primary enabled:hover:bg-muted/50",
        )}
      >
        <span className={cn("mb-3 rounded-full p-3", isDragActive ? "bg-primary/10" : "bg-muted")}>
          {isDragActive
            ? <FileIcon aria-hidden className="size-8 text-primary" />
            : <Upload aria-hidden className="size-8 text-muted-foreground" />}
        </span>
        <span className="mb-1 text-lg font-medium text-foreground">
          {isDragActive ? t("dropNow") : (
            <>
              <span className="sm:hidden">{t("chooseFiles")}</span>
              <span className="hidden sm:inline">{t("dropOrChoose")}</span>
            </>
          )}
        </span>
        <span id={description} className="text-sm text-muted-foreground">{t("fileTypes")}</span>
      </button>
    </div>
  );
}
