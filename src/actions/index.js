export const RESET_DATA = 'RESET_DATA';

/**
 * Overwrite the existing data store when receiving new data from upstream
 * @param {Object} data New pipeline state data
 */
export function resetData(data) {
  return {
    type: RESET_DATA,
    data,
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
    visible,
  };
}

export const TOGGLE_ORIENTATION = 'TOGGLE_ORIENTATION';

/**
 * Toggle whether to show horizontal or vertical orientation
 * @param {string} orientation The orientation to set to vertical by default
 */
export function toggleOrientation(orientation) {
  return {
    type: TOGGLE_ORIENTATION,
    orientation,
  };
}

export const TOGGLE_EXPAND_ALL_PIPELINES = 'TOGGLE_EXPAND_ALL_PIPELINES';

/**
 * Toggle whether to expand all modular pipelines or collapse with boolean.
 * @param {Boolean} shouldExpandAllPipelines
 */
export function toggleExpandAllPipelines(shouldExpandAllPipelines) {
  return {
    type: TOGGLE_EXPAND_ALL_PIPELINES,
    shouldExpandAllPipelines,
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
    visible,
  };
}

export const TOGGLE_SHAREABLE_URL_MODAL = 'TOGGLE_SHAREABLE_URL_MODAL';

/**
 * Toggle whether to show the shareable URL modal
 * @param {Boolean} visible True if the modal is to be shown
 */
export function toggleShareableUrlModal(visible) {
  return {
    type: TOGGLE_SHAREABLE_URL_MODAL,
    visible,
  };
}

export const TOGGLE_SETTINGS_MODAL = 'TOGGLE_SETTINGS_MODAL';

/**
 * Toggle whether to show the settings modal
 * @param {Boolean} visible True if the modal is to be shown
 */
export function toggleSettingsModal(visible) {
  return {
    type: TOGGLE_SETTINGS_MODAL,
    visible,
  };
}

export const TOGGLE_METADATA_MODAL = 'TOGGLE_METADATA_MODAL';

/**
 * Toggle whether to show the plot modal
 * @param {Boolean} visible True if the modal is to be shown
 */
export function togglePlotModal(visible) {
  return {
    type: TOGGLE_METADATA_MODAL,
    visible,
  };
}

export const TOGGLE_GRAPH = 'TOGGLE_GRAPH';

/**
 * Toggle graph visible/hidden
 * @param {Boolean} visible Whether graph is shown
 */
export function toggleGraph(visible) {
  return {
    type: TOGGLE_GRAPH,
    visible,
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
    textLabels,
  };
}

export const SHOW_PIPELINE_FILTER = 'SHOW_PIPELINE_FILTER';

/**
 * Toggle to show pipeline filter
 */
export function togglePipelineFilter() {
  return {
    type: SHOW_PIPELINE_FILTER,
  };
}

export const TOGGLE_IS_PRETTY_NAME = 'TOGGLE_IS_PRETTY_NAME';

/**
 * Toggle whether to show pretty name on/off
 * @param {Boolean} isPrettyName True if pretty name is to be shown
 */
export function toggleIsPrettyName(isPrettyName) {
  return {
    type: TOGGLE_IS_PRETTY_NAME,
    isPrettyName,
  };
}

export const TOGGLE_SHOW_FEATURE_HINTS = 'TOGGLE_SHOW_FEATURE_HINTS';

/**
 * Toggle whether to turn feature hints on/off
 * @param {Boolean} showFeatureHints True if features hints are to be shown
 */
export function toggleShowFeatureHints(showFeatureHints) {
  return {
    type: TOGGLE_SHOW_FEATURE_HINTS,
    showFeatureHints,
  };
}

export const TOGGLE_SHOW_DATASET_PREVIEWS = 'TOGGLE_SHOW_DATASET_PREVIEWS';

export function toggleShowDatasetPreviews(showDatasetPreviews) {
  return {
    type: TOGGLE_SHOW_DATASET_PREVIEWS,
    showDatasetPreviews,
  };
}

export const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';

/**
 * Toggle sidebar visible/hidden
 * @param {Boolean} visible Whether sidebar nav is shown
 */
export function toggleSidebar(visible) {
  return {
    type: TOGGLE_SIDEBAR,
    visible,
  };
}

export const TOGGLE_THEME = 'TOGGLE_THEME';

/**
 * Switch between light/dark theme
 * @param {String} theme Theme name
 */
export function toggleTheme(theme) {
  return {
    type: TOGGLE_THEME,
    theme,
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
    chartSize,
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
    zoom,
  };
}

export const TOGGLE_MINIMAP = 'TOGGLE_MINIMAP';

/**
 * Toggle mini map
 * @param {String} visible Visibility status
 */
export function toggleMiniMap(visible) {
  return {
    type: TOGGLE_MINIMAP,
    visible,
  };
}

export const CHANGE_FLAG = 'CHANGE_FLAG';

/**
 * Change the given feature flag
 * @param {String} name The flag name
 * @param {Value} value The value to set
 */
export function changeFlag(name, value) {
  return {
    type: CHANGE_FLAG,
    name,
    value,
  };
}

export const SET_BANNER = 'SET_BANNER';

/**
 * Change the given banner status
 * @param {String} name The banner name
 * @param {Value} value The value to set
 */
export function setBanner(name, value) {
  return {
    type: SET_BANNER,
    name,
    value,
  };
}

export const TOGGLE_IGNORE_LARGE_WARNING = 'TOGGLE_IGNORE_LARGE_WARNING';

/**
 * Resets the ignoreLargeWarning field in the state indicating user preference to enable large graphs to load
 * @param {Boolean} ignoreLargeWarning
 */
export function toggleIgnoreLargeWarning(ignoreLargeWarning) {
  return {
    type: TOGGLE_IGNORE_LARGE_WARNING,
    ignoreLargeWarning,
  };
}

export const TOGGLE_CODE = 'TOGGLE_CODE';

/**
 * Toggle code panel
 * @param {String} visible Visibility status
 */
export function toggleCode(visible) {
  return {
    type: TOGGLE_CODE,
    visible,
  };
}

export const TOGGLE_TRACEBACK = 'TOGGLE_TRACEBACK';

/**
 * Toggle traceback panel
 * @param {String} visible Visibility status
 */
export function toggleTraceback(visible) {
  return {
    type: TOGGLE_TRACEBACK,
    visible,
  };
}

export const TOGGLE_PARAMETERS_HOVERED = 'TOGGLE_PARAMETERS_HOVERED';

/**
 * Update the value of the currently-active hovered node
 * @param {Boolean} hoveredParameters True if parameters heading in the sidebar has been hovered
 */
export function toggleParametersHovered(hoveredParameters) {
  return {
    type: TOGGLE_PARAMETERS_HOVERED,
    hoveredParameters,
  };
}

export const TOGGLE_MODULAR_PIPELINE_FOCUS_MODE =
  'TOGGLE_MODULAR_PIPELINE_FOCUS_MODE';

/**
 * Update the value of the selected modular pipeline under focus mode
 * @param {Object} modularPipeline The selected modular pipeline for focus mode
 */
export function toggleFocusMode(modularPipeline) {
  return {
    type: TOGGLE_MODULAR_PIPELINE_FOCUS_MODE,
    modularPipeline,
  };
}

export const TOGGLE_HOVERED_FOCUS_MODE = 'TOGGLE_HOVERED_FOCUS_MODE';

/**
 * Update the value of the of the currently-active hovered node from focus mode
 * @param {Boolean} hoveredFocusMode True if FocudModeIcon in the sidebar has been hovered
 */
export function toggleHoveredFocusMode(hoveredFocusMode) {
  return {
    type: TOGGLE_HOVERED_FOCUS_MODE,
    hoveredFocusMode,
  };
}

export const TOGGLE_BOOKMARK = 'TOGGLE_BOOKMARK';

/**
 * Toggle bookmark of Run
 * @param {boolean} bookmark
 * @param {string} runId
 */
export function toggleBookmark(bookmark, runId) {
  return {
    type: TOGGLE_BOOKMARK,
    bookmark,
    runId,
  };
}

export const UPDATE_STATE_FROM_OPTIONS = 'UPDATE_STATE_FROM_OPTIONS';

/**
 * Update state with latest options prop coming from the react component
 * @param {Object} updatedOptions
 */
export const updateStateFromOptions = (updatedOptions) => {
  return {
    type: UPDATE_STATE_FROM_OPTIONS,
    payload: updatedOptions,
  };
};

export const SET_VIEW = 'SET_VIEW';

/**
 * Set the current view between flowchart and workflow
 * @param {String} view The view to set ('flowchart' or 'workflow')
 */
export function setView(view) {
  return {
    type: SET_VIEW,
    view,
  };
}

export const RESET_STATE_FOR_WORKFLOW_VIEW = 'RESET_STATE_FOR_WORKFLOW_VIEW';

/**
 * Reset the state when the view changes to workflow view.
 */
export function resetStateForWorkflowView(expandAllPipelines = true) {
  return {
    type: RESET_STATE_FOR_WORKFLOW_VIEW,
    expandAllPipelines,
  };
}
