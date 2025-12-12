"use client";

import { useState, useCallback } from "react";
import {
  ConvertibleFile,
  generateId,
  getFileExtension,
} from "@/lib/types";
import { ConverterService } from "@/lib/converters";

export interface LongVideoInfo {
  fileName: string;
  duration: string;
  fileId: string;
}

export interface LongMediaInfo extends LongVideoInfo {
  kind: "video" | "audio";
}

export type ConvertAllResult = "no-files" | "needs-confirm" | "converted";

export function useFileConverter() {
  const [files, setFiles] = useState<ConvertibleFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [longMediaWarning, setLongMediaWarning] = useState<LongMediaInfo | null>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    const convertibleFiles: ConvertibleFile[] = [];

    for (const file of newFiles) {
      // Валидация файла
      const validation = ConverterService.validate(file);
      if (!validation.valid) {
        console.warn(`Файл ${file.name} пропущен: ${validation.error}`);
        continue;
      }

      const extension = getFileExtension(file.name);
      const availableFormats = ConverterService.getAvailableFormats(file);
      const defaultTarget = availableFormats[0] || "";

      convertibleFiles.push({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        sourceFormat: extension,
        targetFormat: defaultTarget,
        status: "pending" as const,
        progress: 0,
      });
    }

    setFiles((prev) => [...prev, ...convertibleFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.resultUrl) {
        URL.revokeObjectURL(file.resultUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const updateFileFormat = useCallback((id: string, format: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, targetFormat: format } : f
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    files.forEach((file) => {
      if (file.resultUrl) {
        URL.revokeObjectURL(file.resultUrl);
      }
    });
    setFiles([]);
    setOverallProgress(0);
  }, [files]);

  // Реальная конвертация с использованием ConverterService
  const convertFile = useCallback(async (file: ConvertibleFile): Promise<{ blob: Blob; filename: string }> => {
    const onProgress = (progress: number) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, progress } : f
        )
      );
    };

    const result = await ConverterService.convert(
      file.file,
      file.targetFormat,
      onProgress
    );

    return { blob: result.blob, filename: result.filename };
  }, []);

  // Выполнить конвертацию (внутренняя функция)
  const executeConversion = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsConverting(true);
    setOverallProgress(0);

    const totalFiles = pendingFiles.length;
    let completedCount = 0;

    for (const file of pendingFiles) {
      // Устанавливаем статус "converting"
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "converting" as const, progress: 0 } : f
        )
      );

      try {
        const { blob, filename } = await convertFile(file);
        const resultUrl = URL.createObjectURL(blob);

        // Устанавливаем статус "completed"
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "completed" as const,
                  progress: 100,
                  result: blob,
                  resultUrl,
                  resultFilename: filename,
                }
              : f
          )
        );
      } catch (error) {
        // Устанавливаем статус "error"
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : "Ошибка конвертации",
                }
              : f
          )
        );
      }

      completedCount++;
      setOverallProgress((completedCount / totalFiles) * 100);
    }

    setIsConverting(false);
  }, [files, convertFile]);

  // Проверка на длинные видео и запуск конвертации
  const convertAll = useCallback(async (): Promise<ConvertAllResult> => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return "no-files";

    // Проверяем наличие длинных медиа (видео/аудио)
    for (const file of pendingFiles) {
      const category = ConverterService.getCategory(file.file);

      if (category === "video") {
        const isLong = await ConverterService.isLongVideo(file.file);
        if (isLong) {
          const duration = await ConverterService.getDuration(file.file);
          setLongMediaWarning({
            kind: "video",
            fileName: file.name,
            duration: duration ? ConverterService.formatDuration(duration) : ">3:00",
            fileId: file.id,
          });
          return "needs-confirm";
        }
      }

      if (category === "audio") {
        const isLong = await ConverterService.isLongAudio(file.file);
        if (isLong) {
          const duration = await ConverterService.getDuration(file.file);
          setLongMediaWarning({
            kind: "audio",
            fileName: file.name,
            duration: duration ? ConverterService.formatDuration(duration) : ">3:00",
            fileId: file.id,
          });
          return "needs-confirm";
        }
      }
    }

    await executeConversion();
    return "converted";
  }, [files, executeConversion]);

  // Подтверждение конвертации длинного видео
  const confirmLongMediaConversion = useCallback(async () => {
    setLongMediaWarning(null);
    await executeConversion();
  }, [executeConversion]);

  // Отмена конвертации длинного видео
  const cancelLongMediaConversion = useCallback(() => {
    setLongMediaWarning(null);
  }, []);

  const downloadFile = useCallback((id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file?.result || !file?.resultUrl) return;

    const filename = file.resultFilename || file.name.replace(
      `.${file.sourceFormat}`,
      `.${file.targetFormat}`
    );

    ConverterService.download(file.result, filename);
  }, [files]);

  const downloadAll = useCallback(() => {
    const completedFiles = files.filter((f) => f.status === "completed" && f.result);

    completedFiles.forEach((file) => {
      if (file.result) {
        const filename = file.resultFilename || file.name.replace(
          `.${file.sourceFormat}`,
          `.${file.targetFormat}`
        );
        ConverterService.download(file.result, filename);
      }
    });
  }, [files]);

  // Получение доступных форматов для файла
  const getAvailableFormats = useCallback((file: ConvertibleFile): string[] => {
    return ConverterService.getAvailableFormats(file.file);
  }, []);

  return {
    files,
    isConverting,
    overallProgress,
    longMediaWarning,
    addFiles,
    removeFile,
    updateFileFormat,
    clearAll,
    convertAll,
    confirmLongMediaConversion,
    cancelLongMediaConversion,
    downloadFile,
    downloadAll,
    getAvailableFormats,
  };
}
