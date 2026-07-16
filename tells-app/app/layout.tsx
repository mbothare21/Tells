import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/lib/gameState";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/AuthGate";
import { UserMenu } from "@/components/UserMenu";
import { SessionGuard } from "@/components/SessionGuard";
import { Fullscreen } from "@/components/Fullscreen";
import { MatrixRain } from "@/components/MatrixRain";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Tells",
  description: "AI security awareness — a competitive exercise.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MatrixRain />
        <Logo />
        <GameProvider>
          <AuthProvider>
            <SessionGuard />
            <AuthGate>{children}</AuthGate>
            <UserMenu />
          </AuthProvider>
        </GameProvider>
        <Fullscreen />
      </body>
    </html>
  );
}
