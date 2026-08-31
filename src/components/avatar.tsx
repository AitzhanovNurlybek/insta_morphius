/**
 * Монограмма вместо фотографии. Списки из одних букв и цифр не сканируются:
 * глазу нужен якорь, за который цепляться. Фотографий креаторов у агентства
 * нет, поэтому цвет выводим из имени — он стабильный, и человек начинает
 * узнавать карточку по пятну раньше, чем прочитает подпись.
 */

// Оттенки подобраны к тёмно-красной теме: вино, кирпич, слива, охра, хвоя.
const TONES = [
  { bg: "#4a0f1a", fg: "#f2a8b4" },
  { bg: "#5c2318", fg: "#f5b79e" },
  { bg: "#452038", fg: "#e6acd6" },
  { bg: "#4d3312", fg: "#f0c78a" },
  { bg: "#173a2e", fg: "#8fd9bb" },
  { bg: "#2c2350", fg: "#b3aef0" },
];

function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s._-]/gu, " ").split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function tone(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[hash % TONES.length];
}

export function Avatar({
  name,
  size = 40,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const { bg, fg } = tone(name);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * 0.36,
        letterSpacing: "0.01em",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {initials(name)}
    </span>
  );
}
