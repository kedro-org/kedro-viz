//--- Useful JS utility functions ---//

import { pathRoot } from '../config';

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
 * Determine the endpoint URL for loading different data types
 * @param {string} type Data type
 * @param {string=} id Endpoint identifier e.g. pipeline ID
 */
export const getUrl = (type, id) => {
  switch (type) {
    case 'main':
      return [pathRoot, 'main'].join('/');
    case 'pipeline':
      if (!id) throw new Error('No pipeline ID provided');
      return [pathRoot, 'pipelines', id].join('/');
    default:
      throw new Error('Unknown URL type');
  }
};

/**
 * Filter duplicate values from an array
 * @param {any} d Datum
 * @param {number} i Index
 * @param {Array} arr The array to remove duplicate values from
 */
export const unique = (d, i, arr) => arr.indexOf(d) === i;
