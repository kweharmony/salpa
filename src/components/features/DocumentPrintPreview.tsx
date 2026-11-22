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

  useEffect(() => {
    const iframe = frame.current;
    const previewDocument = iframe?.contentDocument;
    if (!ready || !iframe || !previewDocument) return;

    const pages = previewDocument.querySelectorAll<HTMLElement>(".docx-wrapper > section.docx");
    const widest = Math.max(0, ...Array.from(pages, (page) => page.offsetWidth));
    if (!widest) return;

    const screenStyle = previewDocument.createElement("style");
    previewDocument.head.append(screenStyle);
    const fitPreview = () => {
      const zoom = Math.max(0.1, Math.min(1, (iframe.clientWidth - 32) / widest));
      screenStyle.textContent = `@media screen {
        .docx-wrapper { padding: 12px; }
        .docx-wrapper > section.docx { zoom: ${zoom}; margin-bottom: 12px; }
      }`;
    };

    const resize = new ResizeObserver(fitPreview);
    resize.observe(iframe);
    fitPreview();
    return () => {
      resize.disconnect();
      screenStyle.remove();
    };
  }, [ready]);

  function print() {
    const preview = frame.current?.contentWindow;
    preview?.focus();
    preview?.print();
  }

  return (
    <dialog
      ref={dialog}
      aria-label={t("printPreview")}
      className="m-auto h-[min(48rem,calc(100dvh-1.5rem))] max-h-none w-[min(64rem,calc(100%-1.5rem))] max-w-none overflow-hidden rounded-xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/45 open:flex open:flex-col"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold" title={title}>{title}</h2>
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
        className="block min-h-0 w-full flex-1 bg-white"
      />
    </dialog>
  );
}
