import { useEffect, useState } from "react";

/**
 * useState that mirrors to localStorage so typed input survives
 * tab switches, accidental refreshes, and hot reloads.
 */
export function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota / private-mode — ignore */
    }
  }, [key, value]);

  return [value, setValue, () => window.localStorage.removeItem(key)] as const;
}

