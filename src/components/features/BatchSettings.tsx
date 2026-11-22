"use client";

import { useLocale } from "@/components/layout/LocaleProvider";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConverterService } from "@/lib/converters";
import type { ConvertibleFile, ConversionOptions } from "@/lib/types";

interface BatchSettingsProps {
  files: ConvertibleFile[];
  disabled: boolean;
  onApply: (target: string, options: ConversionOptions, imagesOnly?: boolean) => void;
}

const profiles = {
  small: { quality: 75, bitrate: 128, videoQuality: "low" },
  balanced: { quality: 92, bitrate: 192, videoQuality: "medium" },
  high: { quality: 97, bitrate: 320, videoQuality: "high" },
} as const;

type Profile = keyof typeof profiles;

const fieldClass = "h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm";

export function BatchSettings({ files, disabled, onApply }: BatchSettingsProps) {
  const { t } = useLocale();
  const [target, setTarget] = useState("");
  const [profile, setProfile] = useState<Profile | "custom">("balanced");
  const [imageQuality, setImageQuality] = useState("92");
  const [maxDimension, setMaxDimension] = useState("");
  const [videoQuality, setVideoQuality] = useState<NonNullable<ConversionOptions["videoQuality"]>>("medium");
  const [bitrate, setBitrate] = useState("192");
  const [fastVideo, setFastVideo] = useState(false);

  const editable = files.filter((file) => file.status !== "completed");
  if (!editable.length) return null;

  const targets = [...new Set(editable.flatMap(({ file }) => ConverterService.getAvailableFormats(file)))].sort();
  const selectedTarget = targets.includes(target) ? target : "";
  const hasImages = editable.some(({ category }) => category === "image");
  const hasAudio = editable.some(({ category }) => category === "audio");
  const hasImageOptions = hasImages || editable.some(({ sourceFormat }) => sourceFormat === "pdf");
  const hasVideo = editable.some(({ category }) => category === "video");
  const hasQualitySettings = hasImageOptions || hasAudio || hasVideo;
  const canExportMp3 = targets.includes('mp3');

  function chooseProfile(value: Profile | "custom") {
    setProfile(value);
    if (value === "custom") return;
    const settings = profiles[value];
    setImageQuality(String(settings.quality));
    setVideoQuality(settings.videoQuality);
    setBitrate(String(settings.bitrate));
  }

  function applyPhotoPreset() {
    setTarget("jpg");
    setProfile("custom");
    setImageQuality("80");
    setMaxDimension("1920");
    onApply("jpg", { quality: 0.8, maxDimension: 1920 }, true);
  }

  return (
    <form
      className="mb-4 space-y-3 rounded-lg border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(selectedTarget, {
          quality: Number(imageQuality) / 100,
          maxDimension: maxDimension ? Number(maxDimension) : undefined,
          videoQuality,
          bitrate: Number(bitrate),
          fastVideo,
        });
      }}
      aria-label={t("batchSettings")}
    >
      <fieldset disabled={disabled} className="space-y-3 disabled:opacity-60">
        <legend className="mb-3 text-sm font-semibold">{t("batchSettings")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            {t("compatibleFormat")}
            <select className={fieldClass} value={selectedTarget} onChange={(event) => setTarget(event.target.value)}>
              <option value="">{t("preserveFormats")}</option>
              {targets.map((format) => <option key={format} value={format}>{format.toUpperCase()}</option>)}
            </select>
          </label>
          {hasQualitySettings && (
            <label className="flex flex-col gap-1 text-sm">
              {t("outputQuality")}
              <select className={fieldClass} value={profile} onChange={(event) => chooseProfile(event.target.value as Profile | "custom")}>
                <option value="small">{t("smallerFile")}</option>
                <option value="balanced">{t("balanced")}</option>
                <option value="high">{t("highQuality")}</option>
                <option value="custom" disabled>{t("custom")}</option>
              </select>
            </label>
          )}
        </div>
        {hasQualitySettings && (
          <details className="rounded-md border px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium">{t("advanced")}</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {hasImageOptions && (
                <>
                  <label className="flex flex-col gap-1">
                    {t("imageQuality")}
                    <input className={fieldClass} type="number" min={1} max={100} required
                      value={imageQuality} onChange={(event) => {
                        setImageQuality(event.target.value);
                        setProfile("custom");
                      }} />
                  </label>
                  <label className="flex flex-col gap-1">
                    {t("longestSide")}
                    <input className={fieldClass} type="number" min={1} max={16384} placeholder={t("originalSize")}
                      value={maxDimension} onChange={(event) => setMaxDimension(event.target.value)} />
                  </label>
                </>
              )}
              {canExportMp3 && (
                <label className="flex flex-col gap-1">
                  {t("bitrate")}
                  <select className={fieldClass} value={bitrate} onChange={(event) => {
                    setBitrate(event.target.value);
                    setProfile("custom");
                  }}>
                    {[128, 192, 256, 320].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
              )}
              {hasVideo && (
                <label className="flex flex-col gap-1">
                  {t("videoQuality")}
                  <select className={fieldClass} value={videoQuality} onChange={(event) => {
                    setVideoQuality(event.target.value as typeof videoQuality);
                    setProfile("custom");
                  }}>
                    <option value="low">{t("smallerFile")}</option>
                    <option value="medium">{t("balanced")}</option>
                    <option value="high">{t("highQuality")}</option>
                  </select>
                </label>
              )}
            </div>
            {hasVideo && (
              <label className="mt-3 flex items-start gap-2">
                <input type="checkbox" className="mt-1 accent-primary" checked={fastVideo}
                  onChange={(event) => setFastVideo(event.target.checked)} />
                {t("tryRemux")}
              </label>
            )}
          </details>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" variant="secondary">{t("applySettings")}</Button>
          {hasImages && <Button type="button" size="sm" variant="outline" onClick={applyPhotoPreset}>{t("photoPreset")}</Button>}
        </div>
        {hasImages && <p className="text-sm text-muted-foreground">{t("photoPresetHint")}</p>}
      </fieldset>
    </form>
  );
}
