// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react'; // Added useCallback

function getStorageValue<T>(key: string, defaultValue: T): T {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved) as T;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }
  return defaultValue;
}

// Update return type to include refresh function
export function useLocalStorage<T>(
    key: string,
    defaultValue: T
): [T, Dispatch<SetStateAction<T>>, () => void] { // Added () => void for refresh

  const [value, setValue] = useState<T>(() => {
    return getStorageValue(key, defaultValue);
  });

  // Effect to update localStorage when state 'value' changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        console.log(`Saved key '${key}' to localStorage:`, value);
      } catch (error) {
        console.warn(`Error writing to localStorage key "${key}":`, error);
      }
    }
  }, [key, value]);

  // --- Function to manually re-read from localStorage ---
  const refreshValueFromStorage = useCallback(() => {
      console.log(`Refreshing value for key '${key}' from localStorage...`);
      setValue(getStorageValue(key, defaultValue));
  }, [key, defaultValue]); // Dependencies for the refresh function

  // Return value, setter, and the new refresh function
  return [value, setValue, refreshValueFromStorage];
}