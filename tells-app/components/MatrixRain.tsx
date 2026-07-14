"use client";

import { useEffect, useRef } from "react";

/**
 * Matrix-style digital rain, drawn on a transparent canvas fixed behind the whole app.
 * Kept low-opacity and calm (a slow frame rate) so it reads as background texture and
 * never competes with the UI. Respects prefers-reduced-motion. No assets — pure canvas.
 */
const HEAD = "rgba(190,255,214,"; // bright leading glyph
const TAIL = "rgba(60,200,125,"; // fading trail
const OPACITY = 0.32; // overall strength of the whole layer
const TAIL_LEN = 14;

export function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0,
      h = 0,
      fontSize = 15,
      cols = 0,
      drops: number[] = [],
      raf = 0,
      last = 0;

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
      drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -40));
      ctx!.textBaseline = "top";
      ctx!.font = `${fontSize}px ui-monospace, "SFMono-Regular", Menlo, monospace`;
    }

    resize();
    window.addEventListener("resize", resize);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function drawFrame() {
      ctx!.clearRect(0, 0, w, h);
      ctx!.font = `${fontSize}px ui-monospace, "SFMono-Regular", Menlo, monospace`;
      for (let i = 0; i < cols; i++) {
        const head = drops[i];
        const x = i * fontSize;
        for (let k = 0; k < TAIL_LEN; k++) {
          const row = head - k;
          if (row < 0) continue;
          const a = (1 - k / TAIL_LEN) * (k === 0 ? 1 : 0.75);
          ctx!.fillStyle = (k === 0 ? HEAD : TAIL) + a.toFixed(3) + ")";
          ctx!.fillText(Math.random() < 0.5 ? "0" : "1", x, row * fontSize);
        }
        // recycle the column once its head has fully cleared the bottom,
        // otherwise advance it — never both, or the reset gets clobbered.
        if (head * fontSize > h + TAIL_LEN * fontSize && Math.random() > 0.94) {
          drops[i] = Math.floor(Math.random() * -20);
        } else {
          drops[i] = head + 1;
        }
      }
    }

    if (reduce) {
      // one calm static frame instead of animation
      drawFrame();
    } else {
      const step = (t: number) => {
        raf = requestAnimationFrame(step);
        if (t - last < 60) return; // ~16fps: cheap and unhurried
        last = t;
        drawFrame();
      };
      raf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ opacity: OPACITY }}
    />
  );
}
