interface IconProps {
  name: string;
  className?: string;
}

const PATHS: Record<string, React.ReactNode> = {
  inbox: <path d="M3 13l3-8h12l3 8M3 13v6h18v-6M3 13h5l1 3h6l1-3h5" />,
  check: <path d="M5 12l5 5 9-11" />,
  shield: <><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 00-4-10z" />,
  alert: <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17h.01" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M5 20a7 7 0 0114 0" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  flag: <><path d="M6 21V4" /><path d="M6 5h11l-2.4 3.5L17 12H6z" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>,
  doc: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /></>,
  bot: <><rect x="5" y="8" width="14" height="10" rx="2" /><path d="M12 8V5M9 13h.01M15 13h.01" /></>,
  expand: <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />,
  shrink: <path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" /></>,
  moon: <path d="M20 14.5A8 8 0 019.5 4 7 7 0 1020 14.5z" />,
};

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: "1em", height: "1em", verticalAlign: "-.12em", display: "inline-block" }}
      aria-hidden="true"
    >
      {PATHS[name] ?? null}
    </svg>
  );
}
