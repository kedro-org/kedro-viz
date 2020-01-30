export const RESET_DATA = 'RESET_DATA';

/**
 * Overwrite the existing data store when receiving new data from upstream
 * @param {Object} data New pipeline state data
 */
export function resetData(data) {
  return {
    type: RESET_DATA,
    data
  };
}

export const TOGGLE_NODE_CLICKED = 'TOGGLE_NODE_CLICKED';

/**
 * Update the value of the currently-active clicked node
 * @param {string|null} nodeClicked The node's unique identifier
 */
export function toggleNodeClicked(nodeClicked) {
  return {
    type: TOGGLE_NODE_CLICKED,
    nodeClicked
  };
}

export const TOGGLE_NODES_DISABLED = 'TOGGLE_NODES_DISABLED';

/**
 * Toggle a selected group of nodes' visibility on/off
 * @param {Array} nodeIDs The nodes' unique identifiers
 * @param {Boolean} isDisabled Whether the node should be visible
 */
export function toggleNodesDisabled(nodeIDs, isDisabled) {
  return {
    type: TOGGLE_NODES_DISABLED,
    nodeIDs,
    isDisabled
  };
}

export const TOGGLE_NODE_HOVERED = 'TOGGLE_NODE_HOVERED';

/**
 * Update the value of the currently-active hovered node
 * @param {string|null} nodeHovered The node's unique identifier
 */
export function toggleNodeHovered(nodeHovered) {
  return {
    type: TOGGLE_NODE_HOVERED,
    nodeHovered
  };
}

export const TOGGLE_TEXT_LABELS = 'TOGGLE_TEXT_LABELS';

/**
 * Toggle whether to show text labels on/off
 * @param {Boolean} textLabels True if text labels are to be shown
 */
export function toggleTextLabels(textLabels) {
  return {
    type: TOGGLE_TEXT_LABELS,
    textLabels
  };
}

export const TOGGLE_TAG_ACTIVE = 'TOGGLE_TAG_ACTIVE';

/**
 * Toggle a tag's highlighting on/off
 * @param {string} tagID Tag id
 * @param {Boolean} active True if tag is active
 */
export function toggleTagActive(tagID, active) {
  return {
    type: TOGGLE_TAG_ACTIVE,
    tagID,
    active
  };
}

export const TOGGLE_TAG_FILTER = 'TOGGLE_TAG_FILTER';

/**
 * Toggle a tag on/off
 * @param {string} tagID Tag id
 * @param {Boolean} enabled True if tag is enabled
 */
export function toggleTagFilter(tagID, enabled) {
  return {
    type: TOGGLE_TAG_FILTER,
    tagID,
    enabled
  };
}

export const TOGGLE_THEME = 'TOGGLE_THEME';

/**
 * Switch between light/dark theme
 * @param {string} theme Theme name
 */
export function toggleTheme(theme) {
  return {
    type: TOGGLE_THEME,
    theme
  };
}

export const TOGGLE_TYPE_DISABLED = 'TOGGLE_TYPE_DISABLED';

/**
 * Toggle a node-type's visibility on/off
 * @param {string} typeID Type id
 * @param {Boolean} disabled True if type is disabled
 */
export function toggleTypeDisabled(typeID, disabled) {
  return {
    type: TOGGLE_TYPE_DISABLED,
    typeID,
    disabled
  };
}

export const UPDATE_CHART_SIZE = 'UPDATE_CHART_SIZE';

/**
 * Store the chart size, based on the window
 * @param {Object} chartSize getBoundingClientRect value
 */
export function updateChartSize(chartSize) {
  return {
    type: UPDATE_CHART_SIZE,
    chartSize
  };
}

export const UPDATE_FONT_LOADED = 'UPDATE_FONT_LOADED';

/**
 * Update whether the webfont has loaded, which should block the chart render
 * @param {Boolean} fontLoaded Whether the font has loaded
 */
export function updateFontLoaded(fontLoaded) {
  return {
    type: UPDATE_FONT_LOADED,
    fontLoaded
  };
}
