export const params = {
  focused: 'focused_id=',
  selected: 'selected_id=',
  pipeline: 'pipeline_id=',
};

const activePipeline = `${params.pipeline}:pipelineId`;

export const routes = {
  flowchart: {
    main: '/',
    focusedNode: `/?${activePipeline}&${params.focused}:id`,
    selectedNode: `/?${activePipeline}&${params.selected}:id`,
  },
};
