// src/components/flowchart/flowchart-utils.js

/**
 * Matches all floating point numbers in a string
 */
export const matchFloats = /\d+\.\d+/g;

/**
 * Limits the precision of a float value to one decimal point
 */
export const toSinglePoint = (value) => parseFloat(value).toFixed(1);

/**
 * Limits the precision of a path string to one decimal point
 */
export const limitPrecision = (path) =>
  path.replace(matchFloats, toSinglePoint);

export const processNodeStyles = (nodeStyles, currentTheme) => {
  const processedStyles = {};

  // Apply root-level styles first (common styles)
  Object.keys(nodeStyles).forEach((key) => {
    if (key !== 'themes') {
      processedStyles[key] = nodeStyles[key];
    }
  });

  // Apply theme-specific styles (overwrites common if conflicts)
  if (nodeStyles.themes && nodeStyles.themes[currentTheme]) {
    Object.assign(processedStyles, nodeStyles.themes[currentTheme]);
  }

  return Object.keys(processedStyles).length > 0 ? processedStyles : null;
};
