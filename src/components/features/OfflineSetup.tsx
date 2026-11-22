"use client";

import { useState } from "react";
import { Check, ChevronDown, CloudDownload, Download, RefreshCw, Trash2, WifiOff } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOfflineSetup, type OfflineSelection } from "@/hooks/useOfflineSetup";
import { cn } from "@/lib/utils";

const packs = [
  { id: "audio", label: "audio" },
  { id: "video", label: "offlineVideo" },
] as const;

export function OfflineSetup() {
  const { locale, t } = useLocale();
  const offline = useOfflineSetup();
  const [draft, setDraft] = useState<OfflineSelection | null>(null);
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [removed, setRemoved] = useState(false);
  if (process.env.NODE_ENV !== "production") return null;

  const { status, operation, progress, online, connected, updateAvailable, startupError } = offline;
  const selection = draft ?? { audio: !!status?.audio, video: !!status?.video };
  const changed = selection.audio !== !!status?.audio || selection.video !== !!status?.video;
  const error = offline.error ?? startupError;
  const showPrepare = !status?.shell || changed || updateAvailable;
  const available = [t("offlineBase"), status?.audio && t("offlineAudio"), status?.video && t("offlineVideoItem")]
    .filter(Boolean).join(locale === "zh-Hans" ? "、" : ", ");
  const statusLabel = operation === "prepare" ? "preparingOffline"
    : operation === "clear" ? "offlineRemoving"
    : startupError ? "offlineUnavailable"
    : !status ? "offlineChecking"
    : updateAvailable ? "offlineUpdateReady"
    : status.shell ? "offlineReady" : "offlineNotReady";
  const primaryLabel = !status?.shell ? "prepareOffline" : updateAvailable ? "offlineUpdateAction" : "offlineSaveOptions";
  const percent = progress?.total ? Math.round(100 * progress.loaded / progress.total) : 0;

  async function prepare() {
    setRemoved(false);
    if (await offline.prepare(selection)) setDraft(null);
  }

  async function remove() {
    if (await offline.clear()) {
      setDraft(null);
      setConfirmRemoval(false);
      setRemoved(true);
    }
  }

  return (
    <details className="group mt-4 overflow-hidden rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <CloudDownload aria-hidden className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-foreground">{t("offline")}</span>
            <Badge
              variant="outline"
              aria-live="polite"
              className={cn(
                status?.shell && !updateAvailable && !operation && "border-primary/25 bg-primary/10 text-primary",
                updateAvailable && !operation && "border-amber-200 bg-amber-50 text-amber-900",
              )}
            >
              {t(statusLabel)}
            </Badge>
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {status?.shell ? t("offlineAvailable", { items: available }) : t("offlinePairedHint")}
          </span>
        </span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground group-open:rotate-180" />
      </summary>

      <div className="space-y-4 border-t border-border px-4 py-4 text-sm sm:px-5">
        {!online && (
          <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-foreground">
            <WifiOff aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            {t("offlineNetworkLost")}
          </p>
        )}
        {updateAvailable && <p className="text-muted-foreground">{t("offlineUpdateHint")}</p>}
        {connected && (
          <>
            <p className="text-muted-foreground">{t("offlineHint")}</p>
            <fieldset className="divide-y divide-border rounded-lg border" disabled={!!operation || !online || confirmRemoval}>
              <legend className="sr-only">{t("offlinePacks")}</legend>
              <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-muted/30 px-3 py-2">
                <span className="flex items-center gap-2 font-medium">
                  <Check aria-hidden className="size-4 text-primary" />
                  {t("offlineMainPack")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(status?.shell ? "offlineStored" : "offlineIncluded")}
                </span>
              </div>
              {packs.map(({ id, label }) => (
                <label key={id} className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 hover:bg-muted/30 has-disabled:cursor-default">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label={t(label)}
                      className="size-4 shrink-0 accent-primary"
                      checked={selection[id]}
                      onChange={(event) => {
                        setRemoved(false);
                        setDraft({ ...selection, [id]: event.target.checked });
                      }}
                    />
                    {t(label)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t(status?.[id] ? "offlineStored" : "offlineNotStored")}
                  </span>
                </label>
              ))}
            </fieldset>

            {operation === "prepare" && (
              <div className="space-y-2" role="status">
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-muted-foreground">
                  <span>{progress ? t("offlineProgressCount", { ...progress }) : t("preparingOffline")}</span>
                  {progress && <span className="tabular-nums">{percent}%</span>}
                </div>
                <Progress value={progress ? percent : null} aria-label={t("offlineProgress")} />
              </div>
            )}

            {confirmRemoval ? (
              <div className="space-y-2 rounded-lg border border-destructive/25 p-3">
                <p className="font-medium">{t("offlineRemoveConfirm")}</p>
                <p className="text-muted-foreground">{t("offlineRemoveHint")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={!!operation} onClick={() => setConfirmRemoval(false)}>
                    {t("cancel")}
                  </Button>
                  <Button type="button" size="sm" variant="destructive" disabled={!!operation} onClick={remove}>
                    {t(operation === "clear" ? "offlineRemoving" : "offlineRemove")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {showPrepare && (
                  <Button type="button" size="sm" onClick={prepare} disabled={!online || !!operation}>
                    {updateAvailable ? <RefreshCw aria-hidden /> : <Download aria-hidden />}
                    {t(operation === "prepare" ? "preparingOffline" : primaryLabel)}
                  </Button>
                )}
                {offline.canRemove && (
                  <Button type="button" size="sm" variant="ghost" disabled={!!operation} onClick={() => setConfirmRemoval(true)}>
                    <Trash2 aria-hidden />
                    {t("offlineRemoveAction")}
                  </Button>
                )}
              </div>
            )}
            {removed && <p role="status" className="text-muted-foreground">{t("offlineRemoved")}</p>}
          </>
        )}
        {error && <p role="alert" className="text-destructive">{t(error.key, error.params)}</p>}
        {startupError && startupError.key !== "offlineUnsupported" && (
          <Button type="button" size="sm" variant="outline" onClick={offline.retry} disabled={!online}>
            {t("offlineRetry")}
          </Button>
        )}
      </div>
    </details>
  );
}
