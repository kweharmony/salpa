"use client";

import { useLocale } from "@/components/layout/LocaleProvider";

import { useState } from "react";
import { Shield, Layers, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/features/FileDropzone";
import { FileList } from "@/components/features/FileList";
import { ConversionPanel } from "@/components/features/ConversionPanel";
import { BatchSettings } from "@/components/features/BatchSettings";
import { LongMediaWarning } from "@/components/features/LongMediaWarning";
import { OfflineSetup } from "@/components/features/OfflineSetup";
import { type BatchResult, useFileConverter } from "@/hooks/useFileConverter";

export default function Home() {
  const { t } = useLocale();
  const queue = useFileConverter();
  const [archiving, setArchiving] = useState(false);
  const busy = queue.phase !== "idle";

  function addFiles(files: File[]) {
    const accepted = queue.addFiles(files);
    if (accepted) toast.success(t("filesAdded", { count: accepted }));
  }

  function reportBatch(result: BatchResult) {
    if (result.status !== "finished") return;
    if (result.cancelled) toast.info(t("batchStopped"));
    else if (result.failed) toast.warning(t("batchSummary", { done: result.done, failed: result.failed }));
    else if (result.done) toast.success(t("filesReady", { count: result.done }));
  }

  async function downloadArchive() {
    if (archiving) return;
    setArchiving(true);
    try {
      await queue.downloadArchive();
    } catch {
      toast.error(t("archiveFailed"));
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="flex flex-col">
      {queue.longMedia.length > 0 && (
        <LongMediaWarning
          files={queue.longMedia}
          onConfirm={async () => reportBatch(await queue.confirm())}
          onCancel={queue.cancel}
        />
      )}

      <section className="bg-gradient-to-b from-muted/50 to-background py-12 md:py-16">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {t("homeTitle")}
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            {t("homeIntro")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>{t("noUpload")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span>{t("batch")}</span>
            </div>
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-primary" />
              <span>{t("noRegistration")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-[1200px] px-6">
          <FileDropzone onFilesAdded={addFiles} disabled={busy} />
          {queue.rejected.length > 0 && (
            <div role="status" className="mt-3 rounded-lg border border-destructive/30 p-4 text-sm">
              <p className="font-medium text-destructive">{t("filesSkipped", { count: queue.rejected.length })}</p>
              <ul className="mt-1 max-h-40 list-inside list-disc overflow-auto text-muted-foreground">
                {queue.rejected.map(({ name, error }, index) => (
                  <li key={index} className="break-words">{name} — {t(error.key, error.params)}</li>
                ))}
              </ul>
            </div>
          )}
          <OfflineSetup />
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-[1200px] px-6">
          <BatchSettings
            files={queue.files}
            disabled={busy}
            onApply={(target, options, imagesOnly) => {
              const count = queue.applyBatchSettings(target, options, imagesOnly);
              if (count) toast.success(t("settingsApplied", { count }));
            }}
          />
          <FileList
            files={queue.files}
            disabled={busy}
            onRemove={queue.removeFile}
            onFormatChange={queue.updateFileFormat}
            onDownload={queue.downloadFile}
          />
          <div className="mt-4">
            <ConversionPanel
              files={queue.files}
              onConvertAll={async () => reportBatch(await queue.convertAll())}
              onRetry={async () => reportBatch(await queue.convertAll(true))}
              onCancel={queue.cancel}
              onClearAll={queue.clearAll}
              onDownloadAll={downloadArchive}
              phase={queue.phase}
              overallProgress={queue.overallProgress}
              archiving={archiving}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
