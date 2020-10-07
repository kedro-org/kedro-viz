/**
 * Returns a className string with the given modifiers in BEM style
 * @param {string} name The main class name
 * @param {object} modifiers A map of modifier names to boolean or string values
 * @return {string} The compiled class name(s)
 */
export default (name, modifiers) =>
  Object.keys(modifiers).reduce((classes, modifier) => {
    const value = modifiers[modifier];

    if (typeof value !== 'string' && typeof value !== 'number') {
      return `${classes} ${name}--${value ? '' : 'no-'}${modifier}`;
    }

    return `${classes} ${name}--${modifier}-${(value + '').replace(
      /\s/g,
      '-'
    )}`;
  }, name);
