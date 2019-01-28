export const CHANGE_VIEW = 'CHANGE_VIEW';
export const CHANGE_ACTIVE_PIPELINE = 'CHANGE_ACTIVE_PIPELINE';

export function changeView(view) {
  return {
    type: CHANGE_VIEW,
    view
  };
}

export function changeActivePipeline(pipeline) {
  return {
    type: CHANGE_ACTIVE_PIPELINE,
    pipeline
  };
}