import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creator Platform",
  description: "Платформа агентства: база креаторов, брифы и кампании",
  // На этапе MVP в поиске не светимся (п.8 ТЗ)
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
