import { UPDATE_FONT_LOADED } from '../../actions';

/**
 * Prevent chart from displaying until the webfont has loaded,
 * to ensure that text label SVGRect BBox measurements are accurate
 */
const checkFontLoaded = store => {
  const { fonts } = document;
  const fontName = '10px Titillium Web';

  return new Promise(resolve => {
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
        // Add an extra 0.1s delay because Blink returns true too early
        setTimeout(setLoaded, 100);
        return true;
      }
      return false;
    };

    /**
     * Recursive requestAnimationFrame step function, which acts as a backup
     * to the native FontFaceSet event handlers.
     */
    const step = () => {
      // If it's been 8 seconds since page load then just set to loaded
      if (performance.now() > 8000) {
        setLoaded();
      } else if (!checkIfLoaded()) {
        requestAnimationFrame(step);
      }
    };

    /**
     * Add callbacks to detect when font has loaded, and display the chart.
     * Use both FontFaceSet.ready and FontFaceSet.onloadingdone, as the former often
     * returns too early, and the latter often doesn't return at all.
     * Use requestAnimationFrame as a backup. If the font still hasn't loaded after
     * 8 seconds, then just set loaded to true to avoid running it forever.
     */
    if (fonts.check(fontName)) {
      setLoaded();
    } else {
      fonts.ready.then(checkIfLoaded);
      fonts.onloadingdone = checkIfLoaded;
      requestAnimationFrame(step);
    }
  });
};

export default checkFontLoaded;
