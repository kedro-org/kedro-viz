import { useState, useEffect } from 'react';

const { fonts } = document;
const canUseFontFaceSet = Boolean(fonts && fonts.check);
const fontName = '12px Titillium Web';

/**
 * Prevent chart from displaying until the webfont has loaded,
 * to ensure that text label SVGRect BBox measurements are accurate
 * @param {Object} children React component
 */
const FontLoadChecker = ({ children }) => {
  const [fontLoaded, setLoaded] = useState(
    !canUseFontFaceSet || fonts.check(fontName)
  );

  /**
   * If the webfont is ready, show the chart
   */
  const hasLoaded = () => {
    if (fonts.check(fontName) && !fontLoaded) {
      setLoaded(true);
    }
  };

  /**
   * Use both FontFaceSet.ready and FontFaceSet.onloadingdone, as the former often
   * returns too early, and the latter often doesn't return at all. If neither return
   * in a timely manner, then use setInterval as a fallback so that
   * rendering the chart isn't blocked forever.
   */
  useEffect(() => {
    if (!fontLoaded) {
      fonts.ready.then(hasLoaded);
      fonts.onloadingdone = hasLoaded;
      setTimeout(hasLoaded, 1000);
    }
  });

  return fontLoaded ? children : null;
};

export default FontLoadChecker;
