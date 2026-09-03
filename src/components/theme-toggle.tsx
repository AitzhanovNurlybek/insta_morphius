"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";

const KEY = "theme";
const noopSubscribe = () => () => {};

function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/**
 * Переключатель темы. Значение пишется в localStorage и в data-theme на <html>,
 * откуда его читает CSS. При первом заходе тему берёт из настроек системы —
 * это делает скрипт в layout, чтобы страница не мигала светлым.
 */
export function ThemeToggle() {
  const initial = useSyncExternalStore(noopSubscribe, currentTheme, () => "light" as const);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const active = theme ?? initial;

  const toggle = () => {
    const next = active === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // приватный режим — тема останется до перезагрузки
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost btn-sm"
      aria-label={active === "dark" ? "Светлая тема" : "Тёмная тема"}
      title={active === "dark" ? "Светлая тема" : "Тёмная тема"}
    >
      <Icon name={active === "dark" ? "sun" : "moon"} size={15} />
    </button>
  );
}
