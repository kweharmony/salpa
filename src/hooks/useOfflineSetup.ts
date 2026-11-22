"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { isMessageKey, LocalizedError, messageFromError, type Message } from "@/lib/i18n";

export interface OfflineSelection {
  audio: boolean;
  video: boolean;
}

interface OfflineStatus extends OfflineSelection {
  shell: boolean;
  buildId?: string | null;
}

interface PreparationProgress {
  loaded: number;
  total: number;
}

type WorkerRequest =
  | { type: "offline-status" }
  | { type: "offline-clear" }
  | { type: "offline-prepare"; selection: OfflineSelection };

type WorkerReply =
  | { progress: PreparationProgress }
  | { status: OfflineStatus }
  | { error: string };

function askWorker(
  worker: ServiceWorker,
  request: WorkerRequest,
  onProgress?: (progress: PreparationProgress) => void,
): Promise<OfflineStatus> {
  return new Promise((resolve, reject) => {
    const { port1, port2 } = new MessageChannel();
    const limit = request.type === "offline-prepare" ? 300_000 : 12_000;
    const timeout = setTimeout(() => {
      port1.close();
      reject(new LocalizedError("offlineTimeout"));
    }, limit);

    port1.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
      if ("progress" in data) {
        onProgress?.(data.progress);
        return;
      }
      clearTimeout(timeout);
      port1.close();
      if ("error" in data) {
        const fallback = request.type === "offline-clear" ? "offlineRemoveFailed" : "offlineFailed";
        reject(new LocalizedError(isMessageKey(data.error) ? data.error : fallback));
      } else {
        resolve(data.status);
      }
    };

    try {
      worker.postMessage(request, [port2]);
    } catch (error) {
      clearTimeout(timeout);
      port1.close();
      port2.close();
      reject(error);
    }
  });
}

function subscribeToNetwork(notify: () => void) {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}

function isOnline() {
  return navigator.onLine;
}

function serverOnlineState() {
  return true;
}

export function useOfflineSetup() {
  const online = useSyncExternalStore(subscribeToNetwork, isOnline, serverOnlineState);
  const [worker, setWorker] = useState<ServiceWorker | null>(null);
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [latestBuild, setLatestBuild] = useState<string | null>(null);
  const [startupError, setStartupError] = useState<Message | null>(null);
  const [error, setError] = useState<Message | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState<PreparationProgress | null>(null);
  const [operation, setOperation] = useState<"prepare" | "clear" | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    let mounted = true;
    let requested = 0;
    const service = navigator.serviceWorker;

    const deadline = setTimeout(() => {
      if (mounted) setStartupError({ key: "offlineStartFailed" });
    }, 12_000);

    async function readStatus(active: ServiceWorker) {
      const request = ++requested;
      const saved = await askWorker(active, { type: "offline-status" });
      if (!mounted || request !== requested) return;
      clearTimeout(deadline);
      setWorker(active);
      setStatus(saved);
      setStartupError(null);
    }

    function fail(error: unknown) {
      if (!mounted) return;
      clearTimeout(deadline);
      setStartupError(messageFromError(error, "offlineStartFailed"));
    }

    async function connect() {
      if (!service || !("caches" in window)) throw new LocalizedError("offlineUnsupported");
      const existing = await service.getRegistration();
      if (!existing) await service.register("/sw.js");
      else if (navigator.onLine) void existing.update().catch(() => undefined);
      const ready = await service.ready;
      if (mounted && ready.active) await readStatus(ready.active);
    }

    function controllerChanged() {
      const active = service.controller;
      if (active) void readStatus(active).catch(fail);
    }

    function cacheChanged(event: MessageEvent) {
      if (event.source !== service.controller || event.data?.type !== "offline-changed") return;
      requested++;
      setStatus(event.data.status);
    }

    service?.addEventListener("controllerchange", controllerChanged);
    service?.addEventListener("message", cacheChanged);
    void connect().catch(fail);

    return () => {
      mounted = false;
      clearTimeout(deadline);
      service?.removeEventListener("controllerchange", controllerChanged);
      service?.removeEventListener("message", cacheChanged);
    };
  }, [attempt]);

  const installedBuild = status?.buildId;
  useEffect(() => {
    if (!installedBuild || !online) return;
    const controller = new AbortController();

    async function checkVersion() {
      try {
        const response = await fetch("/offline-assets.json", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const manifest = await response.json();
        if (!controller.signal.aborted && typeof manifest.buildId === "string") {
          setLatestBuild(manifest.buildId);
        }
      } catch {
        // The installed cache is still available when the server cannot be reached.
      }
    }

    void checkVersion();
    window.addEventListener("focus", checkVersion);
    return () => {
      controller.abort();
      window.removeEventListener("focus", checkVersion);
    };
  }, [installedBuild, online]);

  async function change(request: Exclude<WorkerRequest, { type: "offline-status" }>) {
    if (!worker || operation) return false;
    const clearing = request.type === "offline-clear";
    setError(null);
    setProgress(null);
    setOperation(clearing ? "clear" : "prepare");

    try {
      const saved = await askWorker(worker, request, setProgress);
      setStatus(saved);
      setLatestBuild(saved.buildId ?? null);
      return true;
    } catch (error) {
      setError(messageFromError(error, clearing ? "offlineRemoveFailed" : "offlineFailed"));
      return false;
    } finally {
      setOperation(null);
    }
  }

  return {
    online,
    status,
    startupError,
    error,
    progress,
    operation,
    connected: !!worker,
    canRemove: !!installedBuild,
    updateAvailable: !!(installedBuild && online && latestBuild && installedBuild !== latestBuild),
    prepare: (selection: OfflineSelection) => change({ type: "offline-prepare", selection }),
    clear: () => change({ type: "offline-clear" }),
    retry: () => {
      setStartupError(null);
      setAttempt((previous) => previous + 1);
    },
  };
}
