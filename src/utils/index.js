//--- Useful JS utility functions ---//

/**
 * Loop through an array and output to an object
 * @param {Array} array 
 * @param {Function} callback 
 */
export const arrayToObject = (array, callback) => {
  const newObject = {};
  array.forEach((key) => {
    newObject[key] = callback(key);
  });
  return newObject;
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
 * Get a random datum from an array
 * @param {Array} range The array to select a random item from
 */
export const getRandom = range => range[randomIndex(range.length)];

/**
 * Get a random datum from an array that matches a filter condition
 * @param {Array} array The array to select a random item from
 * @param {Function} condition Filter check
 */
export const getRandomMatch = (array, condition) => getRandom(array.filter(condition));

const LOREM_IPSUM = 'lorem ipsum dolor sit amet consectetur adipiscing elit vestibulum id turpis nunc nulla vitae diam dignissim fermentum elit sit amet viverra libero quisque condimentum pellentesque convallis sed consequat neque ac rhoncus finibus'.split(' ');

/**
 * Generate a random latin name
 * @param {number} n Number of words in the name
 * @param {string} join The character(s) used to join each word
 */
export const getRandomName = (n, join = '_') => getNumberArray(n)
  .map(() => getRandom(LOREM_IPSUM))
  .join(join);

/**
 * Filter duplicate values from an array
 * @param {any} d Datum
 * @param {number} i Index
 * @param {Array} arr The array to remove duplicate values from
 */
export const unique = (d, i, arr) => arr.indexOf(d) === i;