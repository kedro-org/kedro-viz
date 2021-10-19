import React from 'react';
import { connect } from 'react-redux';

import { makeStyles, withStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import noop from 'lodash.noop';
import sortBy from 'lodash.sortby';

import { getNodeSelected } from '../../selectors/nodes';
import { isModularPipelineType } from '../../selectors/node-types';
import NodeListTreeItem from './node-list-tree-item';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';

// Display order of node groups
const GROUPED_NODES_DISPLAY_ORDER = {
  modularPipeline: 0,
  task: 1,
  data: 2,
  parameter: 3,
};

// please note that this setup is unique for initialization of the material-ui tree,
// and setup is only used here and not anywhere else in the app.
const useStyles = makeStyles({
  root: {
    height: 110,
    flexGrow: 1,
    maxWidth: 400,
  },
});

const StyledTreeView = withStyles({
  root: {
    padding: '0 0 0 20px',
  },
})(TreeView);

/**
 * Return the data of a modular pipeline to display as a row in the node list.
 * @param {Object} params
 * @param {String} params.id The modular pipeline ID
 * @param {String} params.highlightedLabel The modular pipeline name with highlights when matched under search
 * @param {Object} params.data The modular pipeline data to display
 * @param {Boolean} params.disabled Whether the modular pipeline is disabled, e.g. when it's not the focused one
 * @param {Boolean} params.focused Whether the modular pipeline is the focused one in focus mode
 * @returns
 */
const getModularPipelineRowData = ({
  id,
  highlightedLabel,
  data,
  disabled,
  focused,
}) => ({
  id: id,
  name: highlightedLabel || data.name,
  type: 'modularPipeline',
  icon: 'modularPipeline',
  visibleIcon: VisibleIcon,
  invisibleIcon: InvisibleIcon,
  active: false,
  selected: false,
  faded: false,
  visible: true,
  enabled: true,
  disabled: disabled,
  focused: focused,
  checked: true,
});

/**
 * Return the data of a node to display as a row in the node list
 * @param {Object} node The node to display
 * @param {Boolean} selected Whether the node is currently selected
 */
const getNodeRowData = (node, selected) => {
  const checked = !node.disabledNode;
  const disabled = node.disabledTag || node.disabledType;

  return {
    ...node,
    visibleIcon: VisibleIcon,
    invisibleIcon: InvisibleIcon,
    active: node.active,
    selected: selected,
    faded: disabled || node.disabledNode,
    visible: !disabled && checked,
    checked,
    disabled,
  };
};

const TreeListProvider = ({
  nodeSelected,
  modularPipelinesSearchResult,
  modularPipelinesTree,
  onItemChange,
  onItemMouseEnter,
  onItemMouseLeave,
  onItemClick,
  onNodeToggleExpanded,
  focusMode,
  expanded,
}) => {
  const classes = useStyles();

  // render a leaf node in the modular pipelines tree
  const renderLeafNode = (node) => {
    return (
      <NodeListTreeItem
        data={getNodeRowData(node, nodeSelected[node.id])}
        onItemMouseEnter={onItemMouseEnter}
        onItemMouseLeave={onItemMouseLeave}
        onItemChange={onItemChange}
        onItemClick={onItemClick}
        key={node.id}
      />
    );
  };

  // recursively renders the modular pipeline tree
  const renderTree = (tree, modularPipelineID) => {
    // current tree node to render
    const node = tree[modularPipelineID];
    if (!node) {
      return;
    }

    // render each child of the tree node first
    const children = sortBy(
      node.children,
      (child) => GROUPED_NODES_DISPLAY_ORDER[child.type],
      (child) => child.data.name
    ).map((child) =>
      isModularPipelineType(child.type)
        ? renderTree(tree, child.id)
        : renderLeafNode(child.data)
    );

    // then render the node itself wrapping around the children
    // except when it's the root node,
    // because we don't want to display the __root__ modular pipeline.
    if (modularPipelineID === '__root__') {
      return children;
    }

    return (
      <NodeListTreeItem
        data={getModularPipelineRowData({
          ...node,
          disabled: focusMode && focusMode.id !== node.id,
          focused: focusMode?.id === node.id,
        })}
        onItemMouseEnter={onItemMouseEnter}
        onItemMouseLeave={onItemMouseLeave}
        onItemChange={onItemChange}
        onItemClick={noop}
        key={node.id}>
        {children}
      </NodeListTreeItem>
    );
  };

  const onItemExpandToggle = (event, expandedItemIds) => {
    onNodeToggleExpanded(expandedItemIds);
  };

  return modularPipelinesSearchResult ? (
    <StyledTreeView
      className={classes.root}
      expanded={Object.keys(modularPipelinesSearchResult)}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      key="modularPipelinesSearchResult">
      {renderTree(modularPipelinesSearchResult, '__root__')}
    </StyledTreeView>
  ) : (
    <StyledTreeView
      expanded={expanded}
      className={classes.root}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      onNodeToggle={onItemExpandToggle}
      key="modularPipelinesTree">
      {renderTree(modularPipelinesTree, '__root__')}
    </StyledTreeView>
  );
};

export const mapStateToProps = (state) => ({
  nodeSelected: getNodeSelected(state),
  expanded: state.modularPipeline.expanded,
});

export default connect(mapStateToProps)(TreeListProvider);
