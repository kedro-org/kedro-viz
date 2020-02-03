import { UPDATE_FONT_LOADED } from '../../actions';

/**
 * Prevent chart from displaying until the webfont has loaded,
 * to ensure that text label SVGRect BBox measurements are accurate
 * @param {Object} store Redux store
 * @return {Promise} Resolves when font is detected as having loaded, or after 8 seconds
 */
const checkFontLoaded = store =>
  new Promise(resolve => {
    const { fonts } = document;
    const fontName = '10px Titillium Web';
    /**
     * Dispatch an event to show the chart
     */
    const setLoaded = () => {
      store.dispatch({ type: UPDATE_FONT_LOADED, fontLoaded: true });
      resolve();
    };

    // If FontFaceSet is not supported then default to true immediately
    if (!Boolean(fonts && fonts.check)) {
      setLoaded();
      return;
    }

    /**
     * Check whether the webfont is ready, and show the chart if so
     */
    const checkIfLoaded = () => {
      if (fonts.check(fontName)) {
        // Add 0.1s delay because fonts.check often returns true too early
        setTimeout(setLoaded, 100);
      }
    };

    /**
     * Recursive requestAnimationFrame step function, which acts as a backup
     * to the native FontFaceSet event handlers.
     */
    const step = () => {
      // If it's been 8 seconds since page load then just set loaded=true
      if (performance.now() > 8000) {
        setLoaded();
      } else if (fonts.check(fontName)) {
        // Add 0.1s delay because fonts.check often returns true too early
        setTimeout(setLoaded, 100);
      } else {
        requestAnimationFrame(step);
      }
    };

    if (fonts.check(fontName)) {
      // If the font is already loaded then dispatch immediately
      setLoaded();
    } else {
      // Add event listenerss to detect when font has loaded, and display the chart.
      // This uses both FontFaceSet.ready and FontFaceSet.onloadingdone, as the former
      // often returns too early, and the latter often doesn't return at all.
      if (fonts.ready) {
        fonts.ready.then(checkIfLoaded);
      }
      fonts.onloadingdone = checkIfLoaded;
      // Use requestAnimationFrame as a fallback for older browsers
      requestAnimationFrame(step);
    }
  });

export default checkFontLoaded;
