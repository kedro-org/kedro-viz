export const params = {
  focused: '?focused_id=',
  selected: '?selected_id=',
  expanded: '?expanded_id=',
};

export const routes = {
  flowchart: {
    main: '/',
    focusedNode: `/${params.focused}:id`,
    selectedNode: `/${params.selected}:id`,
    expandedNode: `/${params.expanded}:expandedId/${params.selected}:id`,
  },
};
