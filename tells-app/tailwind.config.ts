import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080a10", panel: "#0e121b", panel2: "#0b0e16",
        line: "#1b2230", line2: "#28324a",
        ink: "#e8ecf5", ink2: "#8a95ac", ink3: "#4d5670",
        acc: "#37e0c4", acc2: "#23b8a0", info: "#5aa2f5",
        warn: "#f5b84a", danger: "#ff5d57", ok: "#54d98a", crit: "#ff3b30",
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
