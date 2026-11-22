"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SalpaLogo } from "./SalpaLogo";
import { Button } from "@/components/ui/button";
import { useLocale } from "./LocaleProvider";
import { isLocale, locales } from "@/lib/i18n";

const navigation = [
  { label: "about", href: "/about" },
  { label: "formats", href: "/formats" },
  { label: "faqLink", href: "/faq" },
] as const;

export function Header() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-0">
          <SalpaLogo size="md" showText={false} />
          <span className="text-xl font-bold text-primary">alpa</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors duration-150 hover:text-primary",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {t(item.label)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <select
            aria-label={t("language")}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            value={locale}
            onChange={(event) => {
              const value = event.target.value;
              if (isLocale(value)) setLocale(value);
            }}
          >
            {Object.entries(locales).map(([language, name]) => (
              <option key={language} value={language} lang={language}>{name}</option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={t(mobileMenuOpen ? "closeMenu" : "openMenu")}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="space-y-1 px-6 py-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-base font-medium transition-colors duration-150",
                  pathname === item.href
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(item.label)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
