/**
 * If the chart is mounted while hidden (display:none / hidden iframe), node
 * label widths measure as 0 and boxes collapse to icon size, and the memoized
 * measurement never re-runs on its own. This triggers a single re-measure (via
 * onReady) once the container becomes visible; a visible mount does nothing.
 *
 * check() is wired to the caller's container ResizeObserver, so revealing a
 * hidden tab/iframe (a 0 -> non-zero size change) triggers the re-measure. With
 * no ResizeObserver (the legacy window-resize fallback) a reveal won't fire it;
 * that's accepted, since ResizeObserver exists in all supported browsers.
 *
 * @param {Function} getContainer Returns the chart container element, or null.
 * @param {Function} onReady Called once when the chart becomes visible.
 * @returns {{ start: Function, check: Function }} start on mount; check when the
 *   container size may have changed.
 */
export const createNodeRemeasurer = (getContainer, onReady) => {
  let armed = false;
  let done = false;

  const isRendered = () => {
    const element = getContainer();
    return Boolean(element && element.getBoundingClientRect().width > 0);
  };

  const check = () => {
    if (!armed || done || !isRendered()) {
      return;
    }
    done = true;
    onReady();
  };

  const start = () => {
    // Only re-measure if the chart was mounted hidden; a visible load already
    // measured correctly.
    armed = !isRendered();
    if (armed) {
      check();
    }
  };

  return { start, check };
};
