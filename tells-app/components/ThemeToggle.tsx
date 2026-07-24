"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

type Theme = "dark" | "light";

/** Applies a theme to <html> and remembers the choice. The initial attribute is
 *  set by the inline no-flash script in layout.tsx, so we only read/toggle here. */
function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("tells-theme", theme);
  } catch {}
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    apply(next);
    setTheme(next);
  }

  const goingLight = theme === "dark";
  return (
    <button
      onClick={toggle}
      title={goingLight ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={goingLight ? "Switch to light theme" : "Switch to dark theme"}
      className="no-print fixed bottom-3 right-[52px] z-[150] w-9 h-9 rounded-lg border border-line2 bg-panel2/80 backdrop-blur text-ink2 hover:text-ink hover:border-acc2 flex items-center justify-center"
    >
      <Icon name={goingLight ? "sun" : "moon"} />
    </button>
  );
}
