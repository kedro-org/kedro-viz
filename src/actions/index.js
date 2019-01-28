export const CHANGE_VIEW = 'CHANGE_VIEW';
export const TOGGLE_TEXT_LABELS = 'TOGGLE_TEXT_LABELS';
export const CHANGE_ACTIVE_PIPELINE = 'CHANGE_ACTIVE_PIPELINE';

export function changeView(view) {
  return {
    type: CHANGE_VIEW,
    view
  };
}

export function toggleTextLabels(textLabels) {
  return {
    type: TOGGLE_TEXT_LABELS,
    textLabels
  };
}

export function changeActivePipeline(pipeline) {
  return {
    type: CHANGE_ACTIVE_PIPELINE,
    pipeline
  };
}