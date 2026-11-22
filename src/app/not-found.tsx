"use client";

import Link from "next/link";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="mb-5 text-3xl font-bold">{t("notFoundPage")}</h1>
      <Button asChild><Link href="/">{t("goHome")}</Link></Button>
    </div>
  );
}
