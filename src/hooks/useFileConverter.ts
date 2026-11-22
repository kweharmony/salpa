"use client";

import { useEffect, useRef, useState } from "react";
import { type ConvertibleFile, type ConversionOptions, detectFormat, generateId } from "@/lib/types";
import { ConverterService } from "@/lib/converters";
import { getMediaDuration } from "@/lib/converters/media-duration";
import { createArchive } from "@/lib/download-archive";
import { messageFromError, type Message } from "@/lib/i18n";

export interface RejectedFile {
  name: string;
  error: Message;
}

interface LongMedia {
  id: string;
  name: string;
  seconds: number;
}

interface Batch {
  files: ConvertibleFile[];
  controller: AbortController;
  awaitingConfirmation: boolean;
}

type Phase = "idle" | "checking" | "confirming" | "converting";

export type BatchResult =
  | { status: "empty" | "confirming" | "busy" }
  | { status: "finished"; done: number; failed: number; cancelled: boolean };

export function useFileConverter() {
  const [files, setFiles] = useState<ConvertibleFile[]>([]);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [overallProgress, setOverallProgress] = useState(0);
  const [longMedia, setLongMedia] = useState<LongMedia[]>([]);
  const active = useRef<Batch | null>(null);

  useEffect(() => () => active.current?.controller.abort(), []);

  function addFiles(incoming: File[]): number {
    if (active.current) return 0;
    const accepted: ConvertibleFile[] = [];
    const skipped: RejectedFile[] = [];

    for (const file of incoming) {
      const source = detectFormat(file);
      const validation = ConverterService.validate(file);
      if (!source || validation.error) {
        skipped.push({ name: file.name, error: validation.error ?? { key: "unknownFormat" } });
        continue;
      }

      accepted.push({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        category: source.category,
        sourceFormat: source.extension,
        targetFormat: source.convertTo[0],
        status: "pending",
        progress: 0,
      });
    }

    setRejected(skipped);
    setFiles((current) => [...current, ...accepted]);
    return accepted.length;
  }

  function updateEntry(id: string, values: Partial<ConvertibleFile>) {
    setFiles((current) => current.map((entry) => entry.id === id ? { ...entry, ...values } : entry));
  }

  function removeFile(id: string) {
    if (!active.current) setFiles((current) => current.filter((file) => file.id !== id));
  }

  function clearAll() {
    if (active.current) return;
    setFiles([]);
    setRejected([]);
    setOverallProgress(0);
  }

  function updateFileFormat(id: string, targetFormat: string) {
    if (active.current) return;
    const file = files.find((entry) => entry.id === id);
    if (file && file.status !== "completed" && ConverterService.getAvailableFormats(file.file).includes(targetFormat)) {
      updateEntry(id, { targetFormat });
    }
  }

  function applyBatchSettings(target: string, options: ConversionOptions, imagesOnly = false) {
    if (active.current) return 0;
    const applicable = files.filter((file) =>
      file.status !== "completed" && (!imagesOnly || file.category === "image") &&
      (!target || ConverterService.getAvailableFormats(file.file).includes(target)),
    );
    const ids = new Set(applicable.map((file) => file.id));
    setFiles((current) => current.map((file) => ids.has(file.id)
      ? { ...file, targetFormat: target || file.targetFormat, options: { ...file.options, ...options } }
      : file,
    ));
    return applicable.length;
  }

  function finish(batch: Batch) {
    if (active.current !== batch) return;
    active.current = null;
    setPhase("idle");
    setLongMedia([]);
  }

  function cancel() {
    const batch = active.current;
    if (!batch) return;
    batch.controller.abort();
    if (batch.awaitingConfirmation) finish(batch);
  }

  async function run(batch: Batch): Promise<BatchResult> {
    batch.awaitingConfirmation = false;
    setLongMedia([]);
    setPhase("converting");
    const { signal } = batch.controller;
    let done = 0;
    let failed = 0;

    try {
      for (const [index, file] of batch.files.entries()) {
        if (signal.aborted) break;
        updateEntry(file.id, { status: "converting", error: undefined, progress: 0 });

        try {
          const result = await ConverterService.convert(file.file, file.targetFormat, (progress) => {
            if (signal.aborted) return;
            updateEntry(file.id, { progress });
            setOverallProgress((index * 100 + progress) / batch.files.length);
          }, file.options, signal);
          signal.throwIfAborted();
          updateEntry(file.id, {
            status: "completed",
            result,
            progress: 100,
          });
          done++;
        } catch (error) {
          if (signal.aborted) {
            updateEntry(file.id, { status: "cancelled", progress: 0 });
            break;
          }
          failed++;
          updateEntry(file.id, {
            status: "error",
            error: messageFromError(error, "failedConversion"),
          });
        }

        setOverallProgress(((index + 1) / batch.files.length) * 100);
      }

      return { status: "finished", done, failed, cancelled: signal.aborted };
    } finally {
      finish(batch);
    }
  }

  async function convertAll(retryErrors = false): Promise<BatchResult> {
    if (active.current) return { status: "busy" };
    const queued = files.filter((file) => retryErrors
      ? file.status === "error"
      : file.status === "pending" || file.status === "cancelled");
    if (!queued.length) return { status: "empty" };

    const batch: Batch = { files: queued, controller: new AbortController(), awaitingConfirmation: false };
    active.current = batch;
    setPhase("checking");
    setOverallProgress(0);
    const { signal } = batch.controller;
    const longFiles: LongMedia[] = [];

    try {
      for (const file of queued) {
        const kind = file.category;
        if (kind !== "video" && (kind !== "audio" || file.targetFormat !== "mp3")) continue;
        const seconds = await getMediaDuration(file.file, kind, signal);
        if (seconds && seconds > 180) longFiles.push({ id: file.id, name: file.name, seconds });
      }
      signal.throwIfAborted();
    } catch {
      finish(batch);
      return { status: "finished", done: 0, failed: 0, cancelled: signal.aborted };
    }

    if (longFiles.length) {
      batch.awaitingConfirmation = true;
      setLongMedia(longFiles);
      setPhase("confirming");
      return { status: "confirming" };
    }

    return run(batch);
  }

  async function confirm() {
    const batch = active.current;
    if (batch?.awaitingConfirmation) return run(batch);
    return { status: "empty" } as const;
  }

  function downloadFile(id: string) {
    const file = files.find((entry) => entry.id === id);
    const result = file?.result;
    if (result?.kind === "download") {
      ConverterService.download(result.blob, result.filename);
    }
  }

  async function downloadArchive() {
    const entries = files.flatMap(({ result }) =>
      result?.kind === "download" ? [{ name: result.filename, blob: result.blob }] : [],
    );
    if (entries.length) ConverterService.download(await createArchive(entries), "Salpa.zip");
  }

  return {
    files, rejected, phase, overallProgress, longMedia,
    addFiles, clearAll, removeFile, updateFileFormat, applyBatchSettings,
    convertAll, confirm, cancel, downloadFile, downloadArchive,
  };
}
