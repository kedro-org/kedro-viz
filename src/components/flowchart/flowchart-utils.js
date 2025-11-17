/**
 * Creates a mapping of node IDs to a boolean indicating if the node ID is included in the given values.
 * @param {Array} nodes - Array of nodes to process.
 * @param {Array} values - Array of values to check against node IDs.
 * @returns {Object} An object mapping node IDs to booleans.
 */
export function createNodeStateMap(nodes, values) {
  const valueSet = new Set(values); // Convert to Set for efficient lookup
  return nodes.reduce((acc, { id }) => {
    acc[id] = valueSet.has(id);
    return acc;
  }, {});
}

/**
 * Processes node styles by merging common styles with theme-specific styles.
 * Root-level properties are applied first as common styles, then theme-specific
 * styles are applied, potentially overwriting common styles for the same properties.
 * @param {Object} nodeStyles - The raw node styles object containing common styles and themes.
 * @param {string} currentTheme - The current theme name (e.g., 'light' or 'dark').
 * @returns {Object|null} A flattened styles object with theme-specific overrides applied,
 *                        or null if no styles are present.
 */
export const processNodeStyles = (nodeStyles, currentTheme) => {
  const processedStyles = {};

  // Apply root-level styles first (common styles)
  Object.keys(nodeStyles).forEach((key) => {
    if (key !== 'themes') {
      processedStyles[key] = nodeStyles[key];
    }
  });

  // Apply theme-specific styles (overwrites common if conflicts)
  if (nodeStyles.themes && nodeStyles.themes[currentTheme]) {
    Object.assign(processedStyles, nodeStyles.themes[currentTheme]);
  }

  return Object.keys(processedStyles).length > 0 ? processedStyles : null;
};
