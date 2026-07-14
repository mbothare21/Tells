"use client";

import { useAuth } from "@/lib/auth";
import { Login } from "./Login";

/** Shows the login screen until a user is authenticated, then the app. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, user } = useAuth();
  if (!ready) return null; // avoid a flash of login before localStorage is read
  if (!user) return <Login />;
  return <>{children}</>;
}
