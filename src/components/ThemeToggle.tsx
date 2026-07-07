"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "dialboard-theme";
const ORDER: Theme[] = ["light", "dark", "system"];
const ICONS = { light: Sun, dark: Moon, system: Monitor };

function applyTheme(theme: Theme) {
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem(STORAGE_KEY);
  } else {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    applyTheme(next);
  }

  const Icon = ICONS[theme];

  return (
    <button
      onClick={cycle}
      title={`Theme: ${theme} (click to change)`}
      className="w-10 h-10 rounded-full bg-surface card-shadow flex items-center justify-center text-muted hover:text-foreground transition"
    >
      <Icon size={16} />
    </button>
  );
}
