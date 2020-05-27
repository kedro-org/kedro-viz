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
 * Filter duplicate values from an array
 * @param {any} d Datum
 * @param {number} i Index
 * @param {Array} arr The array to remove duplicate values from
 */
export const unique = (d, i, arr) => arr.indexOf(d) === i;
