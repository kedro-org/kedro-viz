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

export const useOutsideClick = (callback) => {
  const ref = useRef();

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  return ref;
};
