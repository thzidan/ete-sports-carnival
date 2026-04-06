import { useEffect, useState } from 'react';

const resolveInitialValue = (initialValue) => (typeof initialValue === 'function' ? initialValue() : initialValue);

const readStoredValue = (key, initialValue) => {
  const fallbackValue = resolveInitialValue(initialValue);

  if (typeof window === 'undefined') {
    return fallbackValue;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallbackValue;
  } catch (error) {
    console.warn(`Unable to read local draft for ${key}.`, error);
    return fallbackValue;
  }
};

export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => readStoredValue(key, initialValue));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Unable to save local draft for ${key}.`, error);
    }
  }, [key, state]);

  const clearState = () => {
    const fallbackValue = resolveInitialValue(initialValue);
    setState(fallbackValue);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  };

  return [state, setState, clearState];
}