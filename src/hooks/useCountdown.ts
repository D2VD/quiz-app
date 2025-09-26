import { useEffect, useMemo, useState } from 'react';

interface CountdownState {
  remainingMs: number;
  isExpired: boolean;
  formatted: string;
}

const format = (ms: number) => {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export function useCountdown(targetTime?: string | Date | null, intervalMs = 1000): CountdownState {
  const target = useMemo(() => {
    if (!targetTime) return null;
    return typeof targetTime === 'string' ? Date.parse(targetTime) : targetTime.getTime();
  }, [targetTime]);

  const [remaining, setRemaining] = useState(() => {
    if (!target) return 0;
    return Math.max(0, target - Date.now());
  });

  useEffect(() => {
    if (!target) {
      setRemaining(0);
      return;
    }
    setRemaining(Math.max(0, target - Date.now()));

    const timer = window.setInterval(() => {
      setRemaining((prev) => {
        const next = Math.max(0, target - Date.now());
        if (prev !== next) {
          return next;
        }
        return prev;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, target]);

  return useMemo(
    () => ({
      remainingMs: remaining,
      isExpired: remaining <= 0,
      formatted: format(remaining),
    }),
    [remaining],
  );
}
