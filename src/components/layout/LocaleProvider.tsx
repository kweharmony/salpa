"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { isLocale, translate, type Locale, type Translate } from "@/lib/i18n";

const storageKey = "salpa-language";
const changeEvent = "salpa-language-change";
let fallback: Locale = "ru";

function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(storageKey);
    return isLocale(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(changeEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function setLocale(locale: Locale) {
  fallback = locale;
  try {
    localStorage.setItem(storageKey, locale);
  } catch {
    // Язык всё равно можно сменить для текущей вкладки.
  }
  window.dispatchEvent(new Event(changeEvent));
}

const defaultLocale = (): Locale => "ru";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "ru",
  setLocale,
  t: (key, params) => translate("ru", key, params),
});

export function LocaleProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = useSyncExternalStore(subscribe, readLocale, defaultLocale);
  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key, params) => translate(locale, key, params),
  }), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.querySelector('meta[name="description"]')
      ?.setAttribute("content", translate(locale, "homeIntro"));
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
