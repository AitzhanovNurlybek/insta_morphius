import type { Metadata } from "next";
import { Onest, Spectral } from "next/font/google";
import "./globals.css";

/**
 * Шрифтовая пара вместо системного гротеска.
 *
 * Onest — интерфейсный, кириллица родная, а не приделанная.
 * Spectral — засечный для заголовков и крупных цифр: он даёт продукту
 * характер, которого нет ни у одного интерфейса, собранного по умолчанию.
 */
const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-ui",
  display: "swap",
});

const spectral = Spectral({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Creator Platform",
  description: "Платформа агентства: база креаторов, брифы и кампании",
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
    <html lang="ru" className={`${onest.variable} ${spectral.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
