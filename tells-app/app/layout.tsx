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
import { ThemeToggle } from "@/components/ThemeToggle";

// Runs before paint so the saved theme is applied with no flash of the wrong colours.
const themeInit = `(function(){try{var t=localStorage.getItem('tells-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Tells",
  description: "AI security awareness — a competitive exercise.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
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
        <ThemeToggle />
        <Fullscreen />
      </body>
    </html>
  );
}
