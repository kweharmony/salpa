import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Salpa",
  description: "Конвертируйте файлы локально в браузере. Приватность, скорость, простота. Без загрузки на сервер.",
  keywords: ["конвертер файлов", "браузерный конвертер", "конвертация изображений", "конвертация документов", "приватность"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster position="bottom-right" visibleToasts={3} expand closeButton />
      </body>
    </html>
  );
}
