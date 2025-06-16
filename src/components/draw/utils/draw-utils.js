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
