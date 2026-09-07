import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * Один шрифт на весь интерфейс — Inter.
 *
 * Apple советует брать системный шрифт: в нём уже настроены оптические размеры
 * и трекинг. Но системный на Windows — это Segoe UI, на Android — Roboto,
 * и один экран выглядит тремя разными продуктами. Inter — ближайший к SF Pro
 * гротеск с настоящей кириллицей, поэтому он и стоит везде.
 *
 * Засечный Spectral убран: пара «гротеск + антиква» даёт журнальный вид,
 * а не интерфейсный. Иерархия теперь строится весом, кеглем и трекингом —
 * ровно так, как это делает Apple.
 */
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Creator Platform",
  description: "Digital-отдел продвижения: съёмки, монтаж, креаторы и таргет в одном месте",
  // На этапе MVP в поиске не светимся (п.8 ТЗ)
  robots: { index: false, follow: false },
};

/**
 * Тема ставится до первой отрисовки, иначе на каждой загрузке моргает.
 * По умолчанию светлая: системную настройку намеренно не подхватываем —
 * тёмная у многих стоит на весь телефон, а этот интерфейс должен быть лёгким.
 */
const themeScript = `
try {
  document.documentElement.dataset.theme = localStorage.getItem("theme") || "light";
} catch (e) {
  document.documentElement.dataset.theme = "light";
}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
