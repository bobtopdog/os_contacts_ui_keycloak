'use client';

import { useEffect, useState } from 'react';

/**
 * Returns the value only after it has stopped changing for `delayMs`.
 * Classic debounce for search-as-you-type inputs.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
