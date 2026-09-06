"use client";

import { useState, useTransition } from "react";
import { AVATARS } from "@/lib/gamification";
import { setAvatar } from "@/app/blogger/actions";

/**
 * Выбор аватарки значком. Фотографии блогеры грузят неохотно и в разном
 * качестве, а значок ставится в один тап и всегда выглядит опрятно.
 */
export function AvatarPicker({ current }: { current: string | null }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState(current);

  const choose = (emoji: string) => {
    setPicked(emoji);
    setOpen(false);
    startTransition(() => {
      void setAvatar(emoji);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] text-3xl transition-transform active:scale-95"
        title="Сменить аватарку"
        aria-label="Сменить аватарку"
        disabled={pending}
      >
        {picked ?? "🙂"}
      </button>

      {open && (
        <div className="panel absolute top-full left-0 z-20 mt-2 w-64 p-3">
          <div className="mb-2 text-xs text-[var(--color-muted)]">Выберите аватарку</div>
          <div className="grid grid-cols-8 gap-1">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => choose(emoji)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-lg transition-colors hover:bg-[var(--color-surface-2)] ${
                  picked === emoji ? "bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]" : ""
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
