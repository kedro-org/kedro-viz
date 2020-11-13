import { useState, useLayoutEffect, useRef, useMemo, useCallback } from 'react';

const supported = typeof IntersectionObserver !== 'undefined';

export default ({
  children,
  height,
  total,
  onChange,
  lazy = true,
  dispose = false,
  buffer = 0.5
}) => {
  const active = lazy && supported;

  const [range, setRange] = useState([0, 0]);
  const nextRange = useRef([0, 0]);

  const listRef = useRef();
  const lowerRef = useRef();
  const upperRef = useRef();

  const itemHeight = useMemo(() => height(0, 1), [height]);
  const totalHeight = useMemo(() => height(0, total), [height, total]);
  const upperHeight = useMemo(() => height(0, range[0]), [height, range]);
  const lowerHeight = useMemo(() => height(range[1], total), [
    height,
    range,
    total
  ]);

  if (active) {
    const requestUpdate = useRequestFrameOnce(
      useCallback(() => {
        const visibleRange = visibleRangeOf(
          listRef.current,
          listRef.current?.offsetParent,
          buffer,
          total,
          itemHeight
        );

        const effectiveRange = dispose
          ? visibleRange
          : rangeUnion(nextRange.current, visibleRange);

        // Avoid duplicate renders if ranges are equal
        if (!rangeEqual(nextRange.current, effectiveRange)) {
          nextRange.current = effectiveRange;
          setRange(effectiveRange);
        }
      }, [buffer, total, itemHeight, dispose])
    );

    const observerOptions = useMemo(() => ({ threshold: thresholds(total) }), [
      total
    ]);

    useIntersection(listRef, observerOptions, requestUpdate);
    useIntersection(upperRef, observerOptions, requestUpdate);
    useIntersection(lowerRef, observerOptions, requestUpdate);

    useLayoutEffect(() => requestUpdate(), [total, totalHeight, requestUpdate]);
  }

  const childProps = useMemo(
    () => ({
      start: active ? range[0] : 0,
      end: active ? range[1] : total,
      total,
      listRef,
      upperRef,
      lowerRef,
      listStyle: {
        position: 'relative',
        height: active ? totalHeight : undefined,
        paddingTop: active ? upperHeight : undefined
      },
      upperStyle: {
        position: 'absolute',
        display: !active ? 'none' : undefined,
        height: upperHeight,
        width: '100%',
        top: '0'
      },
      lowerStyle: {
        position: 'absolute',
        display: !active ? 'none' : undefined,
        height: lowerHeight,
        width: '100%',
        bottom: '0'
      }
    }),
    [
      active,
      range,
      total,
      listRef,
      upperRef,
      lowerRef,
      totalHeight,
      upperHeight,
      lowerHeight
    ]
  );

  onChange && onChange(childProps);

  return children(childProps);
};

const range = (start, end, min, max) => [
  Math.max(Math.min(start, max), min),
  Math.max(Math.min(end, max), min)
];

const rangeUnion = (rangeA, rangeB) => [
  Math.min(rangeA[0], rangeB[0]),
  Math.max(rangeA[1], rangeB[1])
];

const rangeEqual = (rangeA, rangeB) =>
  rangeA[0] === rangeB[0] && rangeA[1] === rangeB[1];

const visibleRangeOf = (element, container, buffer, total, itemHeight) => {
  if (!element || !container) {
    return [0, 0];
  }

  const rect = element.getBoundingClientRect();
  const clip = container.getBoundingClientRect();

  const bufferCount = Math.ceil((buffer * clip.height) / itemHeight);

  if (rect.bottom < clip.top) {
    return range(total - bufferCount, total, 0, total);
  }

  if (rect.top > clip.bottom) {
    return range(0, bufferCount, 0, total);
  }

  const top = Math.min(Math.max(rect.top, clip.top), clip.bottom);
  const bottom = Math.max(Math.min(rect.bottom, clip.bottom), clip.top);

  const start = Math.floor((top - rect.top) / itemHeight);
  const end = Math.ceil((bottom - rect.top) / itemHeight);

  return range(start - bufferCount, end + bufferCount, 0, total);
};

const useRequestFrameOnce = callback => {
  const request = useRef();

  // Keep the callback cached to avoid constant re-creation
  return useCallback(() => {
    cancelAnimationFrame(request.current);
    request.current = requestAnimationFrame(callback);
  }, [request, callback]);
};

const thresholds = total =>
  Array.from({ length: total }, (_, i) => i / (total - 1));

const useIntersection = (element, options, callback) => {
  const observer = useRef();

  // Must be an effect to avoid constant re-creation
  return useLayoutEffect(() => {
    if (!element.current) {
      return;
    }
    if (observer.current) {
      observer.current.disconnect();
    }
    observer.current = new IntersectionObserver(callback, options);
    observer.current.observe(element.current);
    callback();
  }, [callback, element, options]);
};
