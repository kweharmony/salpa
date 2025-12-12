"use client";

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
  // Используем ConverterService для получения доступных форматов
  const availableFormats = ConverterService.getAvailableFormats(file.file);

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
        {availableFormats.map((format) => (
          <SelectItem key={format} value={format}>
            {format.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
