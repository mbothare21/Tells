"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Matrix-style digital rain, drawn on a transparent canvas fixed behind the whole app.
 * Kept low-opacity and calm so it reads as background texture and never competes with
 * the UI. Respects prefers-reduced-motion. No assets — pure canvas.
 *
 * Smoothness: columns fall on a *sub-pixel* position driven by elapsed time (not frame
 * count), and each glyph's character is stable (keyed to its grid cell) rather than
 * re-randomised every frame — so the rain glides instead of stepping/shimmering.
 *
 * Theme-aware: bright green on dark; the Calfus teal-blue on light, dialled to stay
 * legible on white without fighting the UI.
 */
const THEMES = {
  dark: { head: "rgba(190,255,214,", tail: "rgba(60,200,125,", opacity: 0.3 },
  // Calfus teal-blue, darker + stronger so it actually reads on a white page.
  light: { head: "rgba(6,84,108,", tail: "rgba(22,132,158,", opacity: 0.42 },
} as const;

const TAIL_LEN = 14;
const ROWS_PER_SEC = 6; // fall speed — calm and unhurried, independent of frame rate

// Stable per-cell glyph: same (column seed, row) always yields the same 0/1, so
// characters don't flicker between frames — only their position moves.
function bit(seed: number, idx: number): string {
  let n = (idx * 374761393 + seed * 668265263) | 0;
  n = (Math.imul(n ^ (n >>> 13), 1274126177)) | 0;
  return (n >>> 15) & 1 ? "1" : "0";
}

function currentTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Keep canvas colours in sync when the user toggles the theme.
  useEffect(() => {
    setTheme(currentTheme());
    const obs = new MutationObserver(() => setTheme(currentTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const palette = THEMES[theme];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0,
      h = 0,
      fontSize = 15,
      cols = 0,
      pos: number[] = [], // float row position of each column head
      seeds: number[] = [], // stable glyph seed per column (changes on recycle)
      raf = 0,
      last = 0;

    function recycle(i: number) {
      pos[i] = -Math.random() * 40; // start staggered above the top
      seeds[i] = (Math.random() * 1e9) | 0;
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      fontSize = w < 640 ? 12 : 15;
      cols = Math.ceil(w / fontSize);
      pos = new Array(cols);
      seeds = new Array(cols);
      for (let i = 0; i < cols; i++) recycle(i);
      ctx!.textBaseline = "top";
      ctx!.font = `${fontSize}px ui-monospace, "SFMono-Regular", Menlo, monospace`;
    }

    resize();
    window.addEventListener("resize", resize);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      ctx!.font = `${fontSize}px ui-monospace, "SFMono-Regular", Menlo, monospace`;
      const bottomRow = h / fontSize;
      for (let i = 0; i < cols; i++) {
        const headRow = pos[i];
        const cell = Math.floor(headRow); // grid cell the head currently occupies
        const x = i * fontSize;
        for (let k = 0; k < TAIL_LEN; k++) {
          const y = (headRow - k) * fontSize; // sub-pixel position → smooth glide
          if (y < -fontSize || y > h) continue;
          const a = (1 - k / TAIL_LEN) * (k === 0 ? 1 : 0.75);
          ctx!.fillStyle = (k === 0 ? palette.head : palette.tail) + a.toFixed(3) + ")";
          ctx!.fillText(bit(seeds[i], cell - k), x, y);
        }
        if (headRow - TAIL_LEN > bottomRow) recycle(i);
      }
    }

    if (reduce) {
      draw(); // one calm static frame instead of animation
    } else {
      const step = (t: number) => {
        raf = requestAnimationFrame(step);
        if (!last) last = t;
        const dt = Math.min((t - last) / 1000, 0.05); // seconds; clamp tab-refocus jumps
        last = t;
        for (let i = 0; i < cols; i++) pos[i] += ROWS_PER_SEC * dt;
        draw();
      };
      raf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ opacity: THEMES[theme].opacity }}
    />
  );
}
