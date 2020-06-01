/**
 * Utility functions for generating random data
 * Number randomiser can be seeded with seedrandom
 * @param {function} random Random number generator
 */
const randomUtils = (random = Math.random) => {
  /**
   * Get an array of numbers
   * @param {number} n Length of the array
   */
  const getNumberArray = n => Array.from(Array(n).keys());

  /**
   * Get a random number between 0 to n-1, inclusive
   * @param {number} n Max number
   */
  const randomIndex = n => Math.floor(random() * n);

  /**
   * Get a random number between 1 to n, inclusive
   * @param {number} n Max number
   */
  const randomNumber = n => Math.ceil(random() * n);

  /**
   * Get a random number between min and max, inclusive
   * @param {number} (min) Min number
   * @param {number} (max) Max number
   */
  const randomNumberBetween = (min, max) => randomNumber(max - min) + min;

  /**
   * Get a random datum from an array
   * @param {Array} range The array to select a random item from
   */
  const getRandom = range => range[randomIndex(range.length)];

  const LOREM_IPSUM = 'lorem ipsum dolor sit amet consectetur adipiscing elit vestibulum id turpis nunc nulla vitae diam dignissim fermentum elit sit amet viverra libero quisque condimentum pellentesque convallis sed consequat neque ac rhoncus finibus'.split(
    ' '
  );

  /**
   * Generate a random latin name
   * @param {number} n Number of words in the name
   * @param {string} join The character(s) used to join each word
   */
  const getRandomName = (n, join = '_') =>
    getNumberArray(n)
      .map(() => getRandom(LOREM_IPSUM))
      .join(join);

  /**
   * Randomly select a certain number (n) of items from an array (arr).
   * via https://stackoverflow.com/a/19270021/1651713
   * @param {array} arr List from which to choose
   * @param {number} n Number of items to select
   */
  const getRandomSelection = (arr, n) => {
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

  /**
   * Generate a pseudo-random UUID
   * via https://stackoverflow.com/a/1349426/1651713
   * @param {number} length Hash/ID length
   * @return string
   */
  const generateHash = length => {
    const result = [];
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      result.push(characters.charAt(randomIndex(characters.length)));
    }
    return result.join('');
  };

  return {
    getNumberArray,
    randomIndex,
    randomNumber,
    randomNumberBetween,
    getRandom,
    getRandomName,
    getRandomSelection,
    generateHash
  };
};

export default randomUtils;
