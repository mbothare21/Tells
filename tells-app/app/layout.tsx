import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/lib/gameState";

export const metadata: Metadata = {
  title: "Tells",
  description: "AI security awareness — a competitive exercise.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
