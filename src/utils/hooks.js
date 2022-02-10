import { useEffect, useRef } from 'react';

/**
 * custom hook to obtain previous values before state changes, value can be any data type
 * @param {value} object
 */
export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
