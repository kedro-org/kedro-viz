import { useState, useEffect, useRef } from 'react';

/**
 * Prevent chart from displaying until the webfont has loaded,
 * to ensure that text label SVGRect BBox measurements are accurate
 * @param {Object} children React component
 */
const FontLoadChecker = ({ children }) => {
  const { fonts } = document;
  const canUseFontFaceSet = Boolean(fonts && fonts.check);
  const fontName = '12px Titillium Web';
  const interval = useRef(null);

  const [fontLoaded, setLoaded] = useState(
    !canUseFontFaceSet || fonts.check(fontName)
  );

  /**
   * If the webfont is ready, show the chart
   */
  const hasLoaded = forceLoad => {
    if (forceLoad || (fonts.check(fontName) && !fontLoaded)) {
      clearInterval(interval.current);
      setLoaded(true);
    }
  };

  /**
   * Add callbacks to detect when font has loaded, and display the chart.
   * Use both FontFaceSet.ready and FontFaceSet.onloadingdone, as the former often
   * returns too early, and the latter often doesn't return at all. Use setInterval as
   * a backup. If the font still hasn't loaded after a second of waiting, then use
   * setInterval as a fallback so that rendering the chart isn't blocked forever.
   */
  useEffect(() => {
    if (!fontLoaded) {
      fonts.ready.then(hasLoaded);
      fonts.onloadingdone = hasLoaded;
      interval.current = setInterval(hasLoaded, 200);
      setTimeout(hasLoaded.bind(this, true), 1000);
    }
  });

  return fontLoaded ? children : null;
};

export default FontLoadChecker;
