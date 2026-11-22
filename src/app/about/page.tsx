"use client";

import { Shield, Zap, MousePointerClick, Code2, Github, Cpu, Globe, Lock } from "lucide-react";
import { FeatureCard } from "@/components/features/FeatureCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SalpaLogo } from "@/components/layout/SalpaLogo";
import Link from "next/link";
import { useLocale } from "@/components/layout/LocaleProvider";

export default function AboutPage() {
  const { t } = useLocale();
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
                <span className="text-primary">Salpa</span> {t("aboutTitle")}
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                {t("aboutIntro")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground">
            {t("aboutFeatures")}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={Shield}
              title={t("privacyTitle")}
              description={t("privacyText")}
            />
            <FeatureCard
              icon={Zap}
              title={t("speedTitle")}
              description={t("speedText")}
            />
            <FeatureCard
              icon={MousePointerClick}
              title={t("simpleTitle")}
              description={t("simpleText")}
            />
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground">
            {t("howItWorks")}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  1
                </div>
                <h4 className="mb-2 font-semibold">{t("stepAdd")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("stepAddTip")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  2
                </div>
                <h4 className="mb-2 font-semibold">{t("stepFormat")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("stepFormatTip")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  3
                </div>
                <h4 className="mb-2 font-semibold">{t("stepConvert")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("stepConvertTip")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  4
                </div>
                <h4 className="mb-2 font-semibold">{t("stepSave")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("stepSaveTip")}
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
            {t("technologies")}
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
                <p className="text-sm text-muted-foreground">{t("backgroundWork")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <Code2 className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">WebAssembly</p>
                <p className="text-sm text-muted-foreground">{t("nativeCode")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <Lock className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">{t("localStorage")}</p>
                <p className="text-sm text-muted-foreground">{t("inMemory")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <Github className="mx-auto mb-4 h-12 w-12" />
          <h2 className="mb-4 text-3xl font-bold">{t("openSource")}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg opacity-90">
            {t("openSourceIntro")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button variant="secondary" size="lg" asChild>
              <a
                href="https://github.com/kweharmony/salpa"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                {t("github")}
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link href="/">
                {t("trySalpa")}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
