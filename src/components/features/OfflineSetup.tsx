"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/layout/LocaleProvider";
import { isMessageKey, LocalizedError, messageFromError, type Message } from "@/lib/i18n";

interface OfflineStatus {
  shell: boolean;
  audio: boolean;
  video: boolean;
}

interface PreparationProgress {
  loaded: number;
  total: number;
}

type WorkerMessage =
  | { progress: PreparationProgress }
  | { status: OfflineStatus }
  | { error: string };

function askWorker(
  worker: ServiceWorker,
  message: { type: string; selection?: Pick<OfflineStatus, "audio" | "video"> },
  onProgress?: (progress: PreparationProgress) => void,
): Promise<OfflineStatus> {
  return new Promise((resolve, reject) => {
    const { port1, port2 } = new MessageChannel();
    const timeout = setTimeout(() => {
      port1.close();
      reject(new LocalizedError("offlineTimeout"));
    }, 300_000);

    port1.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
      if ("progress" in data) {
        onProgress?.(data.progress);
        return;
      }
      clearTimeout(timeout);
      port1.close();
      if ("error" in data) reject(new LocalizedError(isMessageKey(data.error) ? data.error : "offlineFailed"));
      else resolve(data.status);
    };

    worker.postMessage(message, [port2]);
  });
}

export function OfflineSetup() {
  const { locale, t } = useLocale();
  const [worker, setWorker] = useState<ServiceWorker | null>(null);
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState<PreparationProgress | null>(null);
  const [error, setError] = useState<Message | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let mounted = true;

    async function register() {
      const existing = await navigator.serviceWorker.getRegistration();
      if (!existing) await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      if (!mounted || !registration.active) return;
      const saved = await askWorker(registration.active, { type: "offline-status" });
      if (!mounted) return;
      setStatus(saved);
      setAudio(saved.audio);
      setVideo(saved.video);
      setWorker(registration.active);
    }

    void register().catch(() => {
      if (mounted) setError({ key: "offlineStartFailed" });
    });
    return () => { mounted = false; };
  }, []);

  async function prepare() {
    if (!worker || preparing) return;
    setError(null);
    setPreparing(true);
    setProgress(null);

    try {
      const saved = await askWorker(worker, {
        type: "offline-prepare",
        selection: { audio, video },
      }, setProgress);
      setStatus(saved);
    } catch (error) {
      setError(messageFromError(error, "offlineFailed"));
    } finally {
      setPreparing(false);
    }
  }

  if (!worker && !error) return null;

  const available = [t("offlineBase"), status?.audio && t("offlineAudio"), status?.video && t("offlineVideoItem")]
    .filter(Boolean).join(locale === "zh-Hans" ? "、" : ", ");

  return (
    <details className="mt-3 rounded-lg border bg-card px-4 py-3 text-left text-sm">
      <summary className="cursor-pointer font-medium">
        {t(status?.shell ? "offlineReady" : "offline")}
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-muted-foreground">{t("offlineHint")}</p>
        {worker && (
          <>
            <fieldset className="flex flex-wrap gap-x-5 gap-y-2" disabled={preparing}>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={audio} onChange={(event) => setAudio(event.target.checked)} />
                {t("audio")}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={video} onChange={(event) => setVideo(event.target.checked)} />
                {t("offlineVideo")}
              </label>
            </fieldset>
            <Button type="button" variant="outline" size="sm" onClick={prepare} disabled={preparing}>
              {t(preparing ? "preparingOffline" : "prepareOffline")}
            </Button>
            {preparing && progress && (
              <Progress value={100 * progress.loaded / progress.total} aria-label={t("offlineProgress")} />
            )}
            {status?.shell && (
              <p role="status">
                {t("offlineAvailable", { items: available })}
              </p>
            )}
          </>
        )}
        {error && <p role="alert" className="text-destructive">{t(error.key, error.params)}</p>}
      </div>
    </details>
  );
}
