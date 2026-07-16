"use client";

/** Company logo, top-left on every screen. Served from public/assets/company-logo.png
 *  (update the src below to swap it). Purely branding — pointer-events disabled so it
 *  never intercepts clicks. */
export function Logo() {
  return (
    <div className="fixed top-3 left-4 z-[90] pointer-events-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/company-logo.png" alt="Calfus" className="h-[24px] w-auto block" />
    </div>
  );
}
