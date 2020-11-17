import { useState, useLayoutEffect, useRef, useMemo, useCallback } from 'react';

// Required feature checks
const supported = typeof IntersectionObserver !== 'undefined';

/**
 * A component that renders only the children currently visible on screen.
 * @param {function} height A `function(start, end)` returning the pixel height for any given range of items
 * @param {number} total The total count of all items in the list
 * @param {function} children A `function(props)` rendering the list and items (see `childProps`)
 * @param {?number} [buffer=0.5] A number [0...1] as a % of the visible region to render additionally
 * @param {?boolean} [lazy=true] Toggles the lazy functionality
 * @param {?boolean} [dispose=false] Toggles disposing items when they lose visibility
 * @param {?function} onChange Optional change callback
 * @return {object} The rendered children
 **/
export default ({
  height,
  total,
  children,
  lazy = true,
  dispose = false,
  buffer = 0.5,
  onChange
}) => {
  // Active only if enabled by prop and features detected
  const active = lazy && supported;

  // The range of items currently rendered
  const [range, setRange] = useState([0, 0]);
  const rangeRef = useRef([0, 0]);

  // List container element
  const listRef = useRef();

  // Upper placeholder element
  const upperRef = useRef();

  // Lower placeholder element
  const lowerRef = useRef();

  // Height of a single item
  const itemHeight = useMemo(() => height(0, 1), [height]);

  // Height of all items
  const totalHeight = useMemo(() => height(0, total), [height, total]);

  // Height of items above the rendered range
  const upperHeight = useMemo(() => height(0, range[0]), [height, range]);

  // Height of items below the rendered range
  const lowerHeight = useMemo(() => height(range[1], total), [
    height,
    range,
    total
  ]);

  // Skipped if not enabled or supported
  if (active) {
    // Allows an update only once per frame
    const requestUpdate = useRequestFrameOnce(
      // Memoise the frame callback
      useCallback(() => {
        // Get the range of items visible in this frame
        const visibleRange = visibleRangeOf(
          listRef.current,
          listRef.current?.offsetParent,
          buffer,
          total,
          itemHeight
        );

        // Merge ranges
        const effectiveRange =
          // If dispose, render visible range only
          dispose
            ? visibleRange
            : // If not dispose, expand current range with visible range
              rangeUnion(rangeRef.current, visibleRange);

        // Avoid duplicate render calls as state is not set immediate
        if (!rangeEqual(rangeRef.current, effectiveRange)) {
          // Store the update in a ref immediately
          rangeRef.current = effectiveRange;

          // Apply the update in the next render
          setRange(effectiveRange);
        }
      }, [buffer, total, itemHeight, dispose])
    );

    // Memoised observer options
    const observerOptions = useMemo(
      () => ({
        // Create a threshold point for every item
        threshold: thresholds(total)
      }),
      [total]
    );

    // Updates on changes in visibility at the given thresholds (intersection ratios)
    useIntersection(listRef, observerOptions, requestUpdate);
    useIntersection(upperRef, observerOptions, requestUpdate);
    useIntersection(lowerRef, observerOptions, requestUpdate);

    // Updates on changes in item dimensions
    useLayoutEffect(() => requestUpdate(), [
      total,
      itemHeight,
      totalHeight,
      requestUpdate
    ]);
  }

  // Memoised child props for user to apply as needed
  const childProps = useMemo(
    () => ({
      listRef,
      upperRef,
      lowerRef,
      total,
      start: active ? range[0] : 0,
      end: active ? range[1] : total,
      listStyle: {
        // Relative for placeholder positioning
        position: 'relative',
        // List must always have the correct height
        height: active ? totalHeight : undefined,
        // List must always pad missing items (upper at least)
        paddingTop: active ? upperHeight : undefined
      },
      upperStyle: {
        position: 'absolute',
        display: !active ? 'none' : undefined,
        height: upperHeight,
        width: '100%',
        // Upper placeholder must always snap to top edge
        top: '0'
      },
      lowerStyle: {
        position: 'absolute',
        display: !active ? 'none' : undefined,
        height: lowerHeight,
        width: '100%',
        // Lower placeholder must always snap to bottom edge
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

  // Optional change callback
  onChange && onChange(childProps);

  // Render the children
  return children(childProps);
};

/**
 * Returns a range in the form `[start, end]` clamped inside `[min, max]`
 * @param {number} start The start of the range
 * @param {number} end The end of the range
 * @param {number} min The range minimum
 * @param {number} max The range maximum
 * @returns {array} The clamped range
 */
const range = (start, end, min, max) => [
  Math.max(Math.min(start, max), min),
  Math.max(Math.min(end, max), min)
];

/**
 * Returns the union of both ranges
 * @param {array} rangeA The first range `[start, end]`
 * @param {array} rangeB The second range `[start, end]`
 * @returns {array} The range union
 */
const rangeUnion = (rangeA, rangeB) => [
  Math.min(rangeA[0], rangeB[0]),
  Math.max(rangeA[1], rangeB[1])
];

/**
 * Returns true if the ranges have the same `start` and `end` values
 * @param {array} rangeA The first range `[start, end]`
 * @param {array} rangeB The second range `[start, end]`
 * @returns {boolean} True if ranges are equal else false
 */
const rangeEqual = (rangeA, rangeB) =>
  rangeA[0] === rangeB[0] && rangeA[1] === rangeB[1];

/**
 * Gets the range of items inside the container's screen bounds
 * @param {HTMLElement} element The target element (e.g. the list element)
 * @param {HTMLElement} container The container of the target (e.g. a scrolling element)
 * @param {number} buffer A number [0...1] as a % of the container to render additionally
 * @param {number} childTotal The total count of all children in the target (e.g. the list rows)
 * @param {number} childHeight Height of a single child element (e.g. a single list row)
 * @returns {array} The calculated range of visible items as `[start, end]`
 */
const visibleRangeOf = (
  element,
  container,
  buffer,
  childTotal,
  childHeight
) => {
  // Check both elements exist
  if (!element || !container) {
    return [0, 0];
  }

  // Find element bounds
  const rect = element.getBoundingClientRect();
  const clip = container.getBoundingClientRect();

  // Find the number of items to buffer
  const bufferCount = Math.ceil((buffer * clip.height) / childHeight);

  // When element is fully above the container
  if (rect.bottom < clip.top) {
    return range(childTotal - bufferCount, childTotal, 0, childTotal);
  }

  // When element is fully below the container
  if (rect.top > clip.bottom) {
    return range(0, bufferCount, 0, childTotal);
  }

  // Find visible bounds by clipping element bounds on container bounds
  const top = Math.min(Math.max(rect.top, clip.top), clip.bottom);
  const bottom = Math.max(Math.min(rect.bottom, clip.bottom), clip.top);

  // Find the visible item range inside the visible bounds
  const start = Math.floor((top - rect.top) / childHeight);
  const end = Math.ceil((bottom - rect.top) / childHeight);

  // Apply buffer and clamp final range
  return range(start - bufferCount, end + bufferCount, 0, childTotal);
};

/**
 * A hook to create a callback that runs once, at the end of the frame
 * @param {function} callback The callback
 * @returns {function} The wrapped callback
 */
const useRequestFrameOnce = callback => {
  const request = useRef();

  // Allow only a single callback per-frame
  return useCallback(() => {
    cancelAnimationFrame(request.current);
    request.current = requestAnimationFrame(callback);
  }, [request, callback]);
};

/**
 * Generates an array of the form [0, {i / total}, ..., 1]
 * except where total is `0` where it returns `[0]`.
 * @param {number} total The total number of thresholds to create
 * @returns {array} The threshold array
 */
const thresholds = total =>
  total === 0 ? [0] : Array.from({ length: total }, (_, i) => i / (total - 1));

/**
 * A hook that creates and manages an IntersectionObserver for the given element
 * @param {object} element A React.Ref from the target element
 * @param {object} options An IntersectionObserver options object
 * @param {function} callback A function to call with IntersectionObserver changes
 */
const useIntersection = (element, options, callback) => {
  const observer = useRef();

  // After rendering and layout
  return useLayoutEffect(() => {
    // Check the element is ready
    if (!element.current) {
      return;
    }

    // Dispose any previous observer
    if (observer.current) {
      observer.current.disconnect();
    }

    // Create a new observer
    observer.current = new IntersectionObserver(callback, options);
    observer.current.observe(element.current);

    // Manually callback as element may already be visible
    callback();
  }, [callback, element, options]);
};
