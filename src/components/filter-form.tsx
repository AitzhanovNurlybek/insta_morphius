"use client";

import { useRef } from "react";

/**
 * Фильтры применяются сразу при выборе из списка — лишний шаг «нажать Найти»
 * человек всё равно ищет глазами. Текстовый поиск остаётся на Enter и кнопке:
 * дёргать выдачу на каждую букву дороже, чем полезнее.
 */
export function FilterForm({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const form = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={form}
      className={className}
      onChange={(event) => {
        if ((event.target as HTMLElement).tagName === "SELECT") {
          form.current?.requestSubmit();
        }
      }}
    >
      {children}
    </form>
  );
}
