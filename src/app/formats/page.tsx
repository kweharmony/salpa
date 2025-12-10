"use client";

import { useState, useMemo } from "react";
import { Search, Image, FileText, Music, Video, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormatBadge } from "@/components/features/FormatBadge";
import { SUPPORTED_FORMATS, FormatInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

type Category = "all" | "image" | "document" | "audio" | "video";

const categoryIcons = {
  image: Image,
  document: FileText,
  audio: Music,
  video: Video,
};

const categoryNames = {
  all: "Все форматы",
  image: "Изображения",
  document: "Документы",
  audio: "Аудио",
  video: "Видео",
};

export default function FormatsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  const filteredFormats = useMemo(() => {
    return SUPPORTED_FORMATS.filter((format) => {
      const matchesSearch =
        format.extension.toLowerCase().includes(search.toLowerCase()) ||
        format.name.toLowerCase().includes(search.toLowerCase()) ||
        format.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || format.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const groupedFormats = useMemo(() => {
    const groups: Record<string, FormatInfo[]> = {
      image: [],
      document: [],
      audio: [],
      video: [],
    };

    filteredFormats.forEach((format) => {
      groups[format.category].push(format);
    });

    return groups;
  }, [filteredFormats]);

  const categories: Category[] = ["all", "image", "document", "audio", "video"];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
            Поддерживаемые форматы
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Полный список форматов, которые можно конвертировать с помощью Salpa.
            Нажмите на формат, чтобы скопировать его название.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-background py-4 sticky top-16 z-40">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск формата..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {categories.map((category) => {
                const Icon = category !== "all" ? categoryIcons[category] : null;
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="h-8"
                  >
                    {Icon && <Icon className="mr-1 h-4 w-4" />}
                    {categoryNames[category]}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Format tables */}
      <section className="py-8">
        <div className="mx-auto max-w-[1200px] px-6">
          {filteredFormats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">Формат не найден</h3>
              <p className="text-muted-foreground">
                Попробуйте изменить поисковый запрос или выбрать другую категорию
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {(selectedCategory === "all"
                ? (["image", "document", "audio", "video"] as const)
                : [selectedCategory]
              ).map((category) => {
                const formats = groupedFormats[category];
                if (formats.length === 0) return null;

                const Icon = categoryIcons[category];
                return (
                  <div key={category}>
                    <div className="mb-4 flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">{categoryNames[category]}</h2>
                      <span className="text-sm text-muted-foreground">
                        ({formats.length})
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-24">Формат</TableHead>
                            <TableHead>Описание</TableHead>
                            <TableHead className="w-64">Конвертируется в</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formats.map((format) => (
                            <TableRow key={format.extension}>
                              <TableCell>
                                <FormatBadge
                                  format={format.extension}
                                  category={format.category}
                                />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{format.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format.description}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {format.convertTo.map((target) => (
                                    <FormatBadge
                                      key={target}
                                      format={target}
                                      category={format.category}
                                    />
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
