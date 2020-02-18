/**
 * Prevent chart from displaying until the webfont has loaded,
 * to ensure that text label SVGRect BBox measurements are accurate
 * @return {Promise} Resolves when font is detected as having loaded, or after 8 seconds
 */
const checkFontLoaded = () =>
  new Promise(resolve => {
    const { fonts } = document;
    const fontName = '10px Titillium Web';

    // If FontFaceSet is not supported then default to true immediately
    if (!Boolean(fonts && fonts.check)) {
      resolve();
      return;
    }

    /**
     * Check whether the webfont is ready, and show the chart if so
     */
    const checkIfLoaded = () => {
      if (fonts.check(fontName)) {
        // Add 0.1s delay because fonts.check often returns true too early
        setTimeout(resolve, 100);
      }
    };

    /**
     * Recursive requestAnimationFrame step function, which acts as a backup
     * to the native FontFaceSet event handlers.
     */
    const step = () => {
      // If it's been 8 seconds since page load then just set loaded=true
      if (performance.now() > 8000) {
        resolve();
      } else if (fonts.check(fontName)) {
        // Add 0.1s delay because fonts.check often returns true too early
        setTimeout(resolve, 100);
      } else {
        requestAnimationFrame(step);
      }
    };

    if (fonts.check(fontName)) {
      // If the font is already loaded then dispatch immediately
      resolve();
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
