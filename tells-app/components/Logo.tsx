"use client";

/** Company logo, top-left on every screen. Served from public/assets/company-logo.png
 *  (update the src below to swap it). Purely branding — pointer-events disabled so it
 *  never intercepts clicks. */
export function Logo() {
  return (
    <div className="no-print fixed top-3 left-4 z-[90] pointer-events-none">
      {/* Two variants toggled by theme (see globals.css) so the wordmark stays legible
          on both backgrounds — light wordmark on dark, black wordmark on light. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/company-logo.png" alt="Calfus" className="logo-dark h-[24px] w-auto" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/company-logo-black.png" alt="Calfus" className="logo-light h-[24px] w-auto" />
    </div>
  );
}
