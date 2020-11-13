/**
 * Returns true if any of the given props are different between given objects.
 * Only shallow changes are detected.
 */
export default (props, objectA, objectB) => {
  return (
    objectA && objectB && props.some(prop => objectA[prop] !== objectB[prop])
  );
};
