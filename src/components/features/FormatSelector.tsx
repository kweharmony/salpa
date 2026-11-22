"use client";

import { useLocale } from "@/components/layout/LocaleProvider";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConvertibleFile } from "@/lib/types";
import { ConverterService } from "@/lib/converters";

interface FormatSelectorProps {
  file: ConvertibleFile;
  value: string;
  onChange: (format: string) => void;
  disabled?: boolean;
}

export function FormatSelector({
  file,
  value,
  onChange,
  disabled = false,
}: FormatSelectorProps) {
  const { t } = useLocale();
  // Используем ConverterService для получения доступных форматов
  const availableFormats = ConverterService.getAvailableFormats(file.file);

  if (availableFormats.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("unsupported")}
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-32" aria-label={t("targetFormat", { name: file.name })}>
        <SelectValue placeholder={t("format")} />
      </SelectTrigger>
      <SelectContent>
        {availableFormats.map((format) => (
          <SelectItem key={format} value={format}>
            {format.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
