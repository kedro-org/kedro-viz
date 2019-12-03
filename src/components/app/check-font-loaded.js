import { UPDATE_FONT_LOADED } from '../../actions';

/**
 * Prevent chart from displaying until the webfont has loaded,
 * to ensure that text label SVGRect BBox measurements are accurate
 */
const checkFontLoaded = store => {
  const { fonts } = document;
  const canUseFontFaceSet = Boolean(fonts && fonts.check);
  const fontName = '10px Titillium Web';
  let fontLoaded = !canUseFontFaceSet || fonts.check(fontName);

  /**
   * Check whether the webfont is ready, and show the chart if so
   */
  const checkIfLoaded = () => {
    if (fonts.check(fontName) && !fontLoaded) {
      setLoaded();
    }
  };

  /**
   * Stop checking and dispatch an event to show the chart
   */
  const setLoaded = () => {
    fontLoaded = true;
    // Add an extra 0.1s delay because Chrome returns true too early
    setTimeout(() => {
      store.dispatch({ type: UPDATE_FONT_LOADED, fontLoaded });
    }, 100);
  };

  /**
   * Recursive requestAnimationFrame step function, which acts as a backup
   * to the native FontFaceSet event handlers.
   */
  const step = () => {
    checkIfLoaded();
    // If it's been 8 seconds since page load then just set to loaded
    if (performance.now() > 8000) {
      setLoaded();
    } else if (!fontLoaded) {
      requestAnimationFrame(step);
    }
  };

  /**
   * Add callbacks to detect when font has loaded, and display the chart.
   * Use both FontFaceSet.ready and FontFaceSet.onloadingdone, as the former often
   * returns too early, and the latter often doesn't return at all. Use rAF as
   * a backup. If the font still hasn't loaded after 8 seconds of waiting, then
   * just set loaded to true to avoid running it forever
   */
  if (!fontLoaded) {
    fonts.ready.then(checkIfLoaded);
    fonts.onloadingdone = checkIfLoaded;
    requestAnimationFrame(step);
  }
};

export default checkFontLoaded;
