// Returns the key of the given value in the object.
export const getKeyByValue = (object, value) => {
  return Object.keys(object).find((key) => object[key] === value);
};

// Returns an array of keys from the given object that have the specified value.
export const getKeysByValue = (object, value) => {
  return Object.keys(object)
    .filter((key) => object[key] === value)
    .join(',');
};
