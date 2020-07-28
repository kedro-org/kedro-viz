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

export const TOGGLE_LAYERS = 'TOGGLE_LAYERS';

/**
 * Toggle whether to show layers on/off
 * @param {Boolean} visible True if layers are to be shown
 */
export function toggleLayers(visible) {
  return {
    type: TOGGLE_LAYERS,
    visible
  };
}

export const TOGGLE_EXPORT_MODAL = 'TOGGLE_EXPORT_MODAL';

/**
 * Toggle whether to show the export modal
 * @param {Boolean} visible True if the modal is to be shown
 */
export function toggleExportModal(visible) {
  return {
    type: TOGGLE_EXPORT_MODAL,
    visible
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

export const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';

/**
 * Toggle sidebar visible/hidden
 * @param {boolean} visible Whether sidebar nav is shown
 */
export function toggleSidebar(visible) {
  return {
    type: TOGGLE_SIDEBAR,
    visible
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

export const UPDATE_ACTIVE_PIPELINE = 'UPDATE_ACTIVE_PIPELINE';

/**
 * Update the actively-selected pipeline
 * @param {string} pipeline Pipeline ID
 */
export function updateActivePipeline(pipeline) {
  return {
    type: UPDATE_ACTIVE_PIPELINE,
    pipeline
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

export const UPDATE_ZOOM = 'UPDATE_ZOOM';

/**
 * Store the zoom
 * @param {Object} zoom The zoom transform
 */
export function updateZoom(zoom) {
  return {
    type: UPDATE_ZOOM,
    zoom
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

export const TOGGLE_MINIMAP = 'TOGGLE_MINIMAP';

/**
 * Toggle mini map
 * @param {string} visible Visibility status
 */
export function toggleMiniMap(visible) {
  return {
    type: TOGGLE_MINIMAP,
    visible
  };
}

export const CHANGE_FLAG = 'CHANGE_FLAG';

/**
 * Change the given feature flag
 * @param {string} name The flag name
 * @param {value} value The value to set
 */
export function changeFlag(name, value) {
  return {
    type: CHANGE_FLAG,
    name,
    value
  };
}
