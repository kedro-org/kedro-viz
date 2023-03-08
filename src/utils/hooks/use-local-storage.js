import { useState, useCallback } from 'react';

const getType = (value) => {
  const type = typeof value;
  if (type === 'object') {
    if (Array.isArray(value)) {
      return 'array';
    }
    if (value === null) {
      return 'null';
    }
  }
  return type;
};

export const useLocalStorage = (itemKey, initialValue) => {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(itemKey);

      // Parse stored json or if none return initialValue
      const val = item ? JSON.parse(item) : initialValue;

      // fallback to initial state when type does not match initialState
      return getType(val) === getType(initialValue) ? val : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback(
    (value) => {
      try {
        // Save state
        setStoredValue((storedValue) => {
          // Allow value to be a function so we have same API as useState
          const valueToStore =
            value instanceof Function ? value(storedValue) : value;
          // Save to local storage
          window.localStorage.setItem(itemKey, JSON.stringify(valueToStore));

          return valueToStore;
        });
      } catch (error) {
        console.log(error);
      }
    },
    [itemKey]
  );

  return [storedValue, setValue];
};
