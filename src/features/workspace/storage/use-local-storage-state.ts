"use client";

import { useEffect, useState } from "react";

/**
 * Manages a piece of state that is hydrated from localStorage on mount
 * and persisted back whenever it changes. A normalizer function ensures
 * malformed saved data never breaks the UI.
 *
 * Returns [value, setValue, hasLoaded] — the hasLoaded flag lets callers
 * defer rendering or side-effects until hydration is complete.
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T | (() => T),
  normalize: (raw: unknown) => T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [hasLoaded, setHasLoaded] = useState(false);

  /* Hydrate from localStorage on mount */
  useEffect(() => {
    const saved = window.localStorage.getItem(key);

    if (!saved) {
      setHasLoaded(true);
      return;
    }

    try {
      setValue(normalize(JSON.parse(saved)));
    } catch {
      /* Leave the default value in place on parse/normalize failure */
    }

    setHasLoaded(true);
  }, []);

  /* Persist after hydration completes */
  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }, [value, hasLoaded, key]);

  return [value, setValue, hasLoaded];
}
