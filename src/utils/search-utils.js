/**
 * Create a regular expression to match certain keywords
 * @param  {string} value - The search keyword to highlight
 * @return {object|boolean} Regular expression or false
 */
export const getValueRegex = (value) => {
  if (!value) {
    return false;
  }
  return new RegExp(`(${escapeRegExp(value)})`, 'gi');
};

/**
 * Wrap a string with a <b> tag
 * @param  {string} str - The text to wrap
 * @return {string} The emboldened text
 */
const getWrappedMatch = (str) => `<b>${str}</b>`;

/**
 * Highlight relevant keywords within a block of text
 * @param  {string} text - The text to parse
 * @param  {string} value - The search keyword to highlight
 * @return {string} The original text but with <b> tags wrapped around matches
 */
export const getHighlightedText = (text, value) => {
  const valueRegex = getValueRegex(value);
  const matches = text.match(valueRegex);

  return value && matches
    ? text.replace(valueRegex, getWrappedMatch('$1'))
    : text;
};

/**
 * Escape string for use in a regular expression, and to prevent XSS attacks
 * All of these should be escaped: \ ^ $ * + ? . ( ) | { } [ ] < >
 * @param {string} str Search keyword string
 */
export const escapeRegExp = (str) => {
  return str.replace(/[.*+?^${}<>()|[\]\\]/g, '\\$&');
};

/**
 * Check whether a piece of text matches the search value
 * @param {object} text
 * @param {string} searchValue
 * @return {boolean} True if node matches or no search value given
 */
export const textMatchesSearch = (text, searchValue) => {
  if (searchValue) {
    return new RegExp(escapeRegExp(searchValue), 'gi').test(text);
  }

  return true;
};
