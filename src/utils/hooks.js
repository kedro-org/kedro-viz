import { useEffect, useRef } from 'react';

/**
 * Custom hook to obtain previous values before state changes. The value can be any data type.
 * @param {value} object
 */
export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
