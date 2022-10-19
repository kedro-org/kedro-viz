export const params = {
  focused: 'focused_id=',
  selected: 'selected_id=',
  expanded: 'expanded_id=',
  pipeline: 'pipeline_id=',
};

const pipelineActive = `${params.pipeline}:pipelineId`;

export const routes = {
  flowchart: {
    main: '/',
    focusedNode: `/?${pipelineActive}&${params.focused}:id`,
    selectedNode: `/?${pipelineActive}&${params.selected}:id`,
    expandedNode: `/?${pipelineActive}&${params.expanded}:expandedId&${params.selected}:id`,
  },
};
