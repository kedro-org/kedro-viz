export const CHANGE_ACTIVE_PIPELINE = 'CHANGE_ACTIVE_PIPELINE';

export function changeActivePipeline(pipeline) {
  return {
    type: CHANGE_ACTIVE_PIPELINE,
    pipeline
  };
}