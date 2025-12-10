"use client";

import { Shield, Zap, MousePointerClick } from "lucide-react";
import { FileDropzone } from "@/components/features/FileDropzone";
import { FileList } from "@/components/features/FileList";
import { ConversionPanel } from "@/components/features/ConversionPanel";
import { useFileConverter } from "@/hooks/useFileConverter";
import { toast } from "sonner";

export default function Home() {
  const {
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
  } = useFileConverter();

  const handleFilesAdded = (newFiles: File[]) => {
    addFiles(newFiles);
    toast.success(`${newFiles.length} файл${newFiles.length > 1 ? "ов" : ""} добавлен${newFiles.length > 1 ? "о" : ""}`);
  };

  const handleConvertAll = async () => {
    toast.info("Начинаем конвертацию...");
    await convertAll();
    toast.success("Конвертация завершена!");
  };

  const handleClearAll = () => {
    clearAll();
    toast.info("Список очищен");
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12 md:py-16">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Конвертируйте файлы локально в браузере
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Абсолютная приватность. Файлы не покидают ваше устройство.
            Мгновенная скорость без загрузки на сервер.
          </p>

          {/* Features */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-primary" />
              <span>Полная приватность</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-5 w-5 text-primary" />
              <span>Мгновенная скорость</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MousePointerClick className="h-5 w-5 text-primary" />
              <span>Без регистрации</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dropzone Section */}
      <section className="py-8">
        <div className="mx-auto max-w-[1200px] px-6">
          <FileDropzone onFilesAdded={handleFilesAdded} disabled={isConverting} />
        </div>
      </section>

      {/* File List Section */}
      <section className="pb-12">
        <div className="mx-auto max-w-[1200px] px-6">
          <FileList
            files={files}
            onRemove={removeFile}
            onFormatChange={updateFileFormat}
            onDownload={downloadFile}
          />

          {/* Conversion Panel */}
          <div className="mt-4">
            <ConversionPanel
              files={files}
              onConvertAll={handleConvertAll}
              onClearAll={handleClearAll}
              onDownloadAll={downloadAll}
              isConverting={isConverting}
              overallProgress={overallProgress}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
