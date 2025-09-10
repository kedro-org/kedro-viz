import { useEffect, useRef } from 'react';
import { select } from 'd3-selection';

/**
 * To incorporate D3 into React
 */
export const useD3 = (renderFunction, dependencies) => {
  const ref = useRef();

  useEffect(() => {
    renderFunction(select(ref.current));

    return () => {};
  }, [renderFunction, dependencies]);

  return ref;
};
