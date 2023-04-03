// TODO: write tests
export const removeChildFromObject = (originalObj, itemsToRemove) => {
  let updatedObj = { ...originalObj };
  const itemsToRemoveKeys = Object.keys(itemsToRemove);

  itemsToRemoveKeys.map((each) => {
    const { [each]: unused, ...rest } = updatedObj;

    return (updatedObj = { ...rest });
  });

  return updatedObj;
};

export const removeElementsFromObjectValues = (obj, itemsToRemove) => {
  let updatedObj = {};
  const itemsToRemoveValues = Object.values(itemsToRemove);

  for (const [key, value] of Object.entries(obj)) {
    let newVal = [...value];
    newVal = newVal.filter(function (_, index) {
      return itemsToRemoveValues.indexOf(index) === -1;
    });

    updatedObj[key] = newVal;
  }

  return updatedObj;
};
