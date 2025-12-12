"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LongAudioWarningProps {
  fileName: string;
  duration: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LongAudioWarning({
  fileName,
  duration,
  onConfirm,
  onCancel,
}: LongAudioWarningProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-100 p-2">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <CardTitle>Длинное аудио</CardTitle>
              <CardDescription>Конвертация может занять время</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Аудио <span className="font-medium text-foreground">{fileName}</span> имеет
            длительность <span className="font-medium text-foreground">{duration}</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            Конвертация аудио длиннее 3 минут может занять заметное время, особенно
            при преобразовании в MP3.
          </p>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Совет:</strong> Во время конвертации не закрывайте вкладку и
              не сворачивайте браузер.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Отмена
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            Продолжить
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
