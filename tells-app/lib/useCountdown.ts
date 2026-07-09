"use client";

import { useEffect, useRef, useState } from "react";

/** Simple 1s countdown. Calls onExpire once when it hits 0. */
export function useCountdown(seconds: number, running: boolean, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const expired = useRef(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          if (!expired.current) {
            expired.current = true;
            onExpire();
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, onExpire]);

  function reset(to: number) {
    expired.current = false;
    setTimeLeft(to);
  }

  return { timeLeft, reset };
}
