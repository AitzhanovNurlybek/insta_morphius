import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
