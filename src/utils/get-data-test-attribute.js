/**
 * to get a string that can be used as a value for data-test attributes in HTML elements,
 * to make it easier to target of elements for testing purposes.
 * @param {String} component A string representing the name of the main component.
 * @param {String} uiElement A string representing the type of UI element (e.g., button, input, dropdown, event name).
 * @param {String} state (optional) A string representing the state of the UI element (e.g., disabled, active, error).
 * @returns
 */
export const getDataTestAttribute = (component, uiElement, state = '') => {
  const stateSuffix = state ? `-${state}` : '';
  return `${component}--${uiElement}${stateSuffix}`;
};
