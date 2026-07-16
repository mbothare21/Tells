"use client";

import { useEffect, useRef, useState } from "react";

/** Simple 1s countdown. Calls onExpire once when it hits 0.
 *  `timeLeftRef` always holds the current value for accurate reads inside finalize(). */
export function useCountdown(seconds: number, running: boolean, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const timeLeftRef = useRef(seconds);
  const expired = useRef(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTimeLeft((v) => {
        const next = v <= 1 ? 0 : v - 1;
        timeLeftRef.current = next;
        if (v <= 1 && !expired.current) {
          expired.current = true;
          onExpire();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, onExpire]);

  function reset(to: number) {
    expired.current = false;
    timeLeftRef.current = to;
    setTimeLeft(to);
  }

  return { timeLeft, timeLeftRef, reset };
}
