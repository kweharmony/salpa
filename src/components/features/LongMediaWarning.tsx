"use client";

import { useLocale } from "@/components/layout/LocaleProvider";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface LongMediaWarningProps {
  files: { id: string; name: string; seconds: number }[];
  onConfirm: () => void;
  onCancel: () => void;
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export function LongMediaWarning({ files, onConfirm, onCancel }: LongMediaWarningProps) {
  const { t } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog ref={dialog} aria-labelledby="long-media-title"
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(28rem,calc(100%-1.5rem))] overflow-auto rounded-xl border bg-background p-4 text-foreground shadow-xl backdrop:bg-black/45 sm:p-6">
      <h2 id="long-media-title" className="text-lg font-semibold">{t("longMedia")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("longMediaHint")}</p>
      <ul className="mt-3 max-h-40 space-y-1 overflow-auto text-sm">
        {files.map(({ id, name, seconds }) => (
          <li key={id} className="flex justify-between gap-3">
            <span className="break-all">{name}</span>
            <span className="shrink-0">{formatDuration(seconds)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onCancel} autoFocus>{t("back")}</Button>
        <Button onClick={onConfirm}>{t("continue")}</Button>
      </div>
    </dialog>
  );
}
