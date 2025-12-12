"use client";

import { Shield, Zap, MousePointerClick, Code2, Github, Cpu, Globe, Lock } from "lucide-react";
import { FeatureCard } from "@/components/features/FeatureCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SalpaLogo } from "@/components/layout/SalpaLogo";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-12">
            {/* Salpa illustration */}
            <div className="flex-shrink-0">
              <div className="flex h-48 w-48 items-center justify-center rounded-full bg-primary/10">
                <div className="scale-[2.5]">
                  <SalpaLogo size="lg" showText={false} />
                </div>
              </div>
            </div>

            {/* Text content */}
            <div className="text-center md:text-left">
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                <span className="text-primary">Salpa</span> — быстрый и приватный конвертер файлов
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Конвертация изображений, аудио, видео и текста происходит локально в вашем браузере —
                без загрузки на сервер, без регистрации и без следов. Просто добавьте файл и получите результат.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground">
            Три ключевых преимущества
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={Shield}
              title="Полная приватность"
              description="Файлы никогда не покидают ваше устройство. Вся обработка происходит локально в браузере. Никаких серверов, никакого хранения данных."
            />
            <FeatureCard
              icon={Zap}
              title="Мгновенная скорость"
              description="Без загрузки на сервер и ожидания ответа. Конвертация начинается сразу и работает со скоростью вашего процессора."
            />
            <FeatureCard
              icon={MousePointerClick}
              title="Предельная простота"
              description="Без регистрации, настроек или установки. Просто перетащите файл и получите результат за секунды."
            />
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground">
            Как это работает
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  1
                </div>
                <h4 className="mb-2 font-semibold">Загрузка файла</h4>
                <p className="text-sm text-muted-foreground">
                  Перетащите файл в зону загрузки или выберите через диалог
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  2
                </div>
                <h4 className="mb-2 font-semibold">Выбор формата</h4>
                <p className="text-sm text-muted-foreground">
                  Выберите целевой формат из выпадающего списка
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  3
                </div>
                <h4 className="mb-2 font-semibold">Локальная конвертация</h4>
                <p className="text-sm text-muted-foreground">
                  Браузер обрабатывает файл с помощью Web Workers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  4
                </div>
                <h4 className="mb-2 font-semibold">Скачивание</h4>
                <p className="text-sm text-muted-foreground">
                  Скачайте результат — файл удаляется из памяти автоматически
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground">
            Технологии
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <Globe className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Web APIs</p>
                <p className="text-sm text-muted-foreground">File API, Blob, URL</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <Cpu className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Web Workers</p>
                <p className="text-sm text-muted-foreground">Фоновая обработка</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <Code2 className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">WebAssembly</p>
                <p className="text-sm text-muted-foreground">Нативная скорость</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <Lock className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Локальное хранение</p>
                <p className="text-sm text-muted-foreground">Только в памяти</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <Github className="mx-auto mb-4 h-12 w-12" />
          <h2 className="mb-4 text-3xl font-bold">Open Source</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg opacity-90">
            Salpa — полностью открытый проект. Исходный код доступен на GitHub.
            Присоединяйтесь к разработке, сообщайте об ошибках или предлагайте улучшения.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button variant="secondary" size="lg" asChild>
              <a
                href="https://github.com/kweharmony/salpa"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                Посмотреть на GitHub
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link href="/">
                Попробовать Salpa
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
