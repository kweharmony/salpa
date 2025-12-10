"use client";

import { useState, useCallback } from "react";
import {
  ConvertibleFile,
  generateId,
  getFileExtension,
  getFormatInfo,
} from "@/lib/types";

export function useFileConverter() {
  const [files, setFiles] = useState<ConvertibleFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const addFiles = useCallback((newFiles: File[]) => {
    const convertibleFiles: ConvertibleFile[] = newFiles.map((file) => {
      const extension = getFileExtension(file.name);
      const formatInfo = getFormatInfo(extension);
      const defaultTarget = formatInfo?.convertTo[0] || "";

      return {
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        sourceFormat: extension,
        targetFormat: defaultTarget,
        status: "pending" as const,
        progress: 0,
      };
    });

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

  // Simulated conversion (in real app, would use Web Workers)
  const convertFile = useCallback(async (file: ConvertibleFile): Promise<Blob> => {
    // Simulate conversion progress
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          // Create a mock converted blob
          // In real implementation, actual conversion would happen here
          const mockBlob = new Blob([`Converted content of ${file.name}`], {
            type: `application/${file.targetFormat}`,
          });
          resolve(mockBlob);
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, progress: Math.min(progress, 100) } : f
          )
        );
      }, 100);
    });
  }, []);

  const convertAll = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsConverting(true);
    setOverallProgress(0);

    const totalFiles = pendingFiles.length;
    let completedCount = 0;

    for (const file of pendingFiles) {
      // Set file status to converting
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "converting" as const, progress: 0 } : f
        )
      );

      try {
        const result = await convertFile(file);
        const resultUrl = URL.createObjectURL(result);

        // Set file status to completed
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "completed" as const,
                  progress: 100,
                  result,
                  resultUrl,
                }
              : f
          )
        );
      } catch (error) {
        // Set file status to error
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

  const downloadFile = useCallback((id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file?.resultUrl) return;

    const link = document.createElement("a");
    link.href = file.resultUrl;
    link.download = file.name.replace(
      `.${file.sourceFormat}`,
      `.${file.targetFormat}`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [files]);

  const downloadAll = useCallback(() => {
    const completedFiles = files.filter((f) => f.status === "completed");
    completedFiles.forEach((file) => {
      if (file.resultUrl) {
        const link = document.createElement("a");
        link.href = file.resultUrl;
        link.download = file.name.replace(
          `.${file.sourceFormat}`,
          `.${file.targetFormat}`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }, [files]);

  return {
    files,
    isConverting,
    overallProgress,
    addFiles,
    removeFile,
    updateFileFormat,
    clearAll,
    convertAll,
    downloadFile,
    downloadAll,
  };
}
