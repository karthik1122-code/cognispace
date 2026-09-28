import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any value by a specified delay (default 800ms).
 */
export function useDebounce<T>(value: T, delay = 800): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
