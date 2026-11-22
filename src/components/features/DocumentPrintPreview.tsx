"use client";

import { useLocale } from "@/components/layout/LocaleProvider";

import { useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentPrintPreviewProps {
  title: string;
  html: string;
  onClose: () => void;
}

export function DocumentPrintPreview({ title, html, onClose }: DocumentPrintPreviewProps) {
  const { t } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  function print() {
    const preview = frame.current?.contentWindow;
    preview?.focus();
    preview?.print();
  }

  return (
    <dialog
      ref={dialog}
      aria-label={t("printPreview")}
      className="m-auto max-h-[90dvh] w-[min(64rem,calc(100%-2rem))] overflow-hidden rounded-xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/45"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{t("printHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>{t("close")}</Button>
          <Button onClick={print} disabled={!ready}>
            <Printer className="h-4 w-4" />
            {t("printAndSave")}
          </Button>
        </div>
      </div>
      <iframe
        ref={frame}
        title={t("documentPages")}
        srcDoc={html}
        sandbox="allow-same-origin allow-modals"
        onLoad={() => setReady(true)}
        className="block h-[min(70dvh,48rem)] w-full bg-white"
      />
    </dialog>
  );
}
