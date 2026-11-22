"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { SalpaLogo } from "./SalpaLogo";
import { useLocale } from "./LocaleProvider";

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo and description */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Link href="/" className="flex items-center gap-0">
              <SalpaLogo size="sm" showText={false} />
              <span className="text-lg font-bold text-primary">alpa</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("homeTitle")}
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
            >
              {t("about")}
            </Link>
            <Link
              href="/formats"
              className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
            >
              {t("formats")}
            </Link>
            <Link
              href="/faq"
              className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
            >
              {t("faqLink")}
            </Link>
          </div>

          {/* GitHub */}
          <a
            href="https://github.com/kweharmony/salpa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
          >
            <Github className="h-5 w-5" />
            <span>GitHub</span>
          </a>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            {t("sourceProject", { year: new Date().getFullYear() })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("version", { value: "1.0.0" })}
          </p>
        </div>
      </div>
    </footer>
  );
}
