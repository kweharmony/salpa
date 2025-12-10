"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { SalpaLogo } from "./SalpaLogo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo and description */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <SalpaLogo size="sm" />
            <p className="text-sm text-muted-foreground">
              Конвертируйте файлы локально в браузере
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
            >
              О проекте
            </Link>
            <Link
              href="/formats"
              className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
            >
              Форматы
            </Link>
            <Link
              href="/faq"
              className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
            >
              FAQ
            </Link>
          </div>

          {/* GitHub */}
          <a
            href="https://github.com/salpa-converter"
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
            2025 Salpa. Open Source проект.
          </p>
          <p className="text-xs text-muted-foreground">
            Версия 1.0.0
          </p>
        </div>
      </div>
    </footer>
  );
}
