export const getKeysByValue = (object, value) => {
  return Object.keys(object)
    .filter((key) => object[key] === value)
    .join(',');
};
