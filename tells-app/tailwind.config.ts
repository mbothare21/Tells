import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Colours are driven by CSS variables (channel triplets) so the whole UI
      // can flip between dark and light via the data-theme attribute on <html>.
      // See app/globals.css for the actual values per theme.
      colors: {
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        panel: "rgb(var(--c-panel) / <alpha-value>)",
        panel2: "rgb(var(--c-panel2) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        line2: "rgb(var(--c-line2) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        ink2: "rgb(var(--c-ink2) / <alpha-value>)",
        ink3: "rgb(var(--c-ink3) / <alpha-value>)",
        acc: "rgb(var(--c-acc) / <alpha-value>)",
        acc2: "rgb(var(--c-acc2) / <alpha-value>)",
        info: "rgb(var(--c-info) / <alpha-value>)",
        warn: "rgb(var(--c-warn) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        ok: "rgb(var(--c-ok) / <alpha-value>)",
        crit: "rgb(var(--c-crit) / <alpha-value>)",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        drop: { from: { opacity: "0", transform: "translateY(-12px) scale(.97)" }, to: { opacity: "1", transform: "none" } },
        fadein: { from: { opacity: "0" }, to: { opacity: "1" } },
        popup: { "0%": { opacity: "0", transform: "translateY(6px) scale(.8)" }, "20%": { opacity: "1", transform: "translateY(0) scale(1)" }, "100%": { opacity: "0", transform: "translateY(-34px) scale(1)" } },
        flash: { "0%": { opacity: "0" }, "30%": { opacity: "1" }, "100%": { opacity: "0" } },
        lowpulse: { "0%,100%": { opacity: ".4" }, "50%": { opacity: "1" } },
        toastin: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        drop: "drop .35s cubic-bezier(.2,.8,.2,1)",
        fadein: "fadein .25s",
        popup: "popup 1s ease forwards",
        flash: "flash .4s ease",
        lowpulse: "lowpulse 1.1s infinite",
        toastin: "toastin .3s",
      },
    },
  },
  plugins: [],
};
export default config;
