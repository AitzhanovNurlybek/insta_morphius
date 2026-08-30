"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn btn-primary",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "Сохраняю…" : children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}

/** Мультивыбор чекбоксами — ниши, форматы. Значения уходят одним именем в FormData. */
export function CheckboxGroup({
  name,
  options,
  selected = [],
}: {
  name: string;
  options: readonly string[];
  selected?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-1.5 text-sm"
        >
          <input
            type="checkbox"
            name={name}
            value={option}
            defaultChecked={selected.includes(option)}
            className="accent-[var(--color-accent)]"
          />
          {option}
        </label>
      ))}
    </div>
  );
}
