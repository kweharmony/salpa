"use client";

import { useState, useMemo } from "react";
import { Search, HelpCircle, Github, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getFaq, FAQ_CATEGORIES } from "@/lib/faq-data";
import { useLocale } from "@/components/layout/LocaleProvider";
import { cn } from "@/lib/utils";

export default function FAQPage() {
  const { locale, t } = useLocale();
  const questions = useMemo(() => getFaq(locale), [locale]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredFAQ = useMemo(() => {
    return questions.filter((item) => {
      const matchesSearch =
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        item.answer.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [questions, search, selectedCategory]);

  const groupedFAQ = useMemo(() => {
    if (selectedCategory !== "all") {
      return { [selectedCategory]: filteredFAQ };
    }

    const groups: Record<string, typeof questions> = {};
    filteredFAQ.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredFAQ, selectedCategory]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
            {t("faqTitle")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t("faqIntro")}
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="border-b border-border bg-background py-4 sticky top-16 z-40">
        <div className="mx-auto max-w-[800px] px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchFaq")}
              aria-label={t("searchFaq")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </section>

      {/* Category filters */}
      <section className="py-4">
        <div className="mx-auto max-w-[800px] px-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {FAQ_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  selectedCategory !== category.id && "hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                )}
              >
                {t(category.label)}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-8">
        <div className="mx-auto max-w-[800px] px-6">
          {filteredFAQ.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HelpCircle className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">{t("faqNotFound")}</h3>
              <p className="text-muted-foreground">
                {t("changeSearch")}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedFAQ).map(([category, items]) => {
                const categoryInfo = FAQ_CATEGORIES.find((c) => c.id === category);
                return (
                  <div key={category}>
                    {selectedCategory === "all" && (
                      <h2 className="mb-4 text-lg font-semibold text-foreground">
                        {categoryInfo ? t(categoryInfo.label) : category}
                      </h2>
                    )}
                    <Accordion type="single" collapsible className="space-y-2">
                      {items.map((item) => (
                        <AccordionItem
                          key={item.id}
                          value={item.id}
                          className="rounded-lg border border-border bg-card px-4 last:border-b"
                        >
                          <AccordionTrigger className="text-left hover:no-underline">
                            <span className="font-medium">{item.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-[800px] px-6 text-center">
          <MessageCircle className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            {t("faqContactTitle")}
          </h2>
          <p className="mb-6 text-muted-foreground">
            {t("faqContactText")}
          </p>
          <Button variant="default" size="lg" asChild>
            <a
              href="https://github.com/kweharmony/salpa/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-5 w-5" />
              {t("issues")}
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
