//--- Useful JS utility functions ---//

/**
 * Loop through an array and output to an object
 * @param {Array} array
 * @param {Function} callback
 */
export const arrayToObject = (array, callback) => {
  const newObject = {};
  array.forEach(key => {
    newObject[key] = callback(key);
  });
  return newObject;
};

/**
 * Format a UNIX timestamp into a human-readable string
 * @param {number|string} datetime A UNIX timestamp
 * @returns {string} The date and time but prettier
 */
export const formatTime = datetime => {
  const d = new Date(+datetime);
  return `${d.toDateString()} ${d.toLocaleTimeString()}`;
};

/**
 * Get an array of numbers
 * @param {number} n Length of the array
 */
export const getNumberArray = n => Array.from(Array(n).keys());

/**
 * Get a random number between 0 to n-1, inclusive
 * @param {number} n Max number
 */
export const randomIndex = n => Math.floor(Math.random() * n);

/**
 * Get a random number between 1 to n, inclusive
 * @param {number} n Max number
 */
export const randomNumber = n => Math.ceil(Math.random() * n);

/**
 * Get a random number between min and max, inclusive
 * @param {number} (min) Min number
 * @param {number} (max) Max number
 */
export const randomNumberBetween = (min, max) => randomNumber(max - min) + min;

/**
 * Get a random datum from an array
 * @param {Array} range The array to select a random item from
 */
export const getRandom = range => range[randomIndex(range.length)];

export const LOREM_IPSUM = 'lorem ipsum dolor sit amet consectetur adipiscing elit vestibulum id turpis nunc nulla vitae diam dignissim fermentum elit sit amet viverra libero quisque condimentum pellentesque convallis sed consequat neque ac rhoncus finibus'.split(
  ' '
);

/**
 * Generate a random latin name
 * @param {number} n Number of words in the name
 * @param {string} join The character(s) used to join each word
 */
export const getRandomName = (n, join = '_') =>
  getNumberArray(n)
    .map(() => getRandom(LOREM_IPSUM))
    .join(join);

/**
 * Randomly select a certain number (n) of items from an array (arr).
 * via https://stackoverflow.com/a/19270021/1651713
 * @param {array} arr List from which to choose
 * @param {number} n Number of items to select
 */
export const getRandomSelection = (arr, n) => {
  const result = new Array(n);
  let len = arr.length;
  const taken = new Array(len);
  if (n > len) {
    return arr;
  }
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
};

/**
 * Filter duplicate values from an array
 * @param {any} d Datum
 * @param {number} i Index
 * @param {Array} arr The array to remove duplicate values from
 */
export const unique = (d, i, arr) => arr.indexOf(d) === i;
