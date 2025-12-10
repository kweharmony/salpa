"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FormatBadgeProps {
  format: string;
  category?: "image" | "document" | "audio" | "video";
  className?: string;
}

const categoryColors = {
  image: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  document: "bg-green-100 text-green-700 hover:bg-green-200",
  audio: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  video: "bg-orange-100 text-orange-700 hover:bg-orange-200",
};

export function FormatBadge({ format, category, className }: FormatBadgeProps) {
  const handleClick = () => {
    navigator.clipboard.writeText(format.toUpperCase());
    toast.success(`${format.toUpperCase()} скопирован`);
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "cursor-pointer transition-colors duration-150",
        category && categoryColors[category],
        className
      )}
      onClick={handleClick}
    >
      {format.toUpperCase()}
    </Badge>
  );
}
