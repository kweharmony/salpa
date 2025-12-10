"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFormatInfo, SUPPORTED_FORMATS } from "@/lib/types";

interface FormatSelectorProps {
  sourceFormat: string;
  value: string;
  onChange: (format: string) => void;
  disabled?: boolean;
}

export function FormatSelector({
  sourceFormat,
  value,
  onChange,
  disabled = false,
}: FormatSelectorProps) {
  const formatInfo = getFormatInfo(sourceFormat);
  const availableFormats = formatInfo?.convertTo || [];

  if (availableFormats.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Формат не поддерживается
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-32">
        <SelectValue placeholder="Формат" />
      </SelectTrigger>
      <SelectContent>
        {availableFormats.map((format) => {
          const info = SUPPORTED_FORMATS.find(f => f.extension === format);
          return (
            <SelectItem key={format} value={format}>
              {info?.name || format.toUpperCase()}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
