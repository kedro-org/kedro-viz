import seedrandom from 'seedrandom';

/**
 * Generate a pseudo-random UUID
 * via https://stackoverflow.com/a/1349426/1651713
 * @param {number} length Hash/ID length
 * @return string
 */
export const generateHash = length => {
  const result = [];
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result.push(
      characters.charAt(Math.floor(Math.random() * characters.length))
    );
  }
  return result.join('');
};

/**
 * Seed data with a random hash, allowing it to be reproduced.
 * If the URL searchParams contain a 'seed' key then use its value,
 * else create a new one, and make it available via the console.
 */
export const getSeedFromURL = () => {
  let url;
  let seed;
  try {
    url = new URL(document.location.href);
    seed = url.searchParams.get('seed');
  } catch (e) {
    console.warn('Random data seeding is not supported in this browser');
    return;
  }
  if (!seed) {
    seed = generateHash(30);
    url.searchParams.set('seed', seed);
  }
  if (typeof jest === 'undefined') {
    console.info(
      `%cRandom data seed: ${seed}\nTo reuse this layout, visit ${url.toString()}`,
      'font-weight: bold'
    );
  }
  return seed;
};

// Set up seeded random number generator:
const seed = getSeedFromURL();
export const random = seedrandom(seed);

/**
 * Get an array of numbers
 * @param {number} n Length of the array
 */
export const getNumberArray = n => Array.from(Array(n).keys());

/**
 * Get a random number between 0 to n-1, inclusive
 * @param {number} n Max number
 */
export const randomIndex = n => Math.floor(random() * n);

/**
 * Get a random number between 1 to n, inclusive
 * @param {number} n Max number
 */
export const randomNumber = n => Math.ceil(random() * n);

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
    var x = Math.floor(random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
};
