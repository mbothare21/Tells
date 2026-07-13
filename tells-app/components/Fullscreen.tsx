"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/**
 * Makes the game feel full-screen. Native fullscreen (which hides the browser chrome)
 * can only be requested from a user gesture — a page can't force it on load — so we:
 *   1. request it on the very FIRST click/keypress (feels automatic), once, best-effort;
 *   2. always offer a toggle button so the player can enter/exit on demand.
 * If the browser blocks native fullscreen (permissions, embeds), the app's own
 * full-viewport layout still fills the window.
 */
export function Fullscreen() {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const sync = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);

    // fire once, on the first user gesture, then remove the listeners
    const tryEnter = () => {
      document.documentElement.requestFullscreen?.().catch(() => {});
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", tryEnter);
      window.removeEventListener("keydown", tryEnter);
    };
    window.addEventListener("pointerdown", tryEnter, { once: true });
    window.addEventListener("keydown", tryEnter, { once: true });

    return () => {
      document.removeEventListener("fullscreenchange", sync);
      cleanup();
    };
  }, []);

  function toggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }

  return (
    <button
      onClick={toggle}
      title={isFs ? "Exit fullscreen" : "Go fullscreen"}
      aria-label={isFs ? "Exit fullscreen" : "Go fullscreen"}
      className="fixed bottom-3 right-3 z-[150] w-9 h-9 rounded-lg border border-line2 bg-panel2/80 backdrop-blur text-ink2 hover:text-ink hover:border-acc2 flex items-center justify-center"
    >
      <Icon name={isFs ? "shrink" : "expand"} />
    </button>
  );
}
