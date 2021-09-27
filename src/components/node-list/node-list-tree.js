import React from 'react';
import { connect } from 'react-redux';

import { makeStyles, withStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import noop from 'lodash.noop';
import sortBy from 'lodash.sortby';

import { getNodeSelected } from '../../selectors/nodes';
import NodeListTreeItem from './node-list-tree-item';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';

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

const isModularPipelineType = (type) => type === 'modularPipeline';

const getModularPipelineRowData = ({
  id,
  highlightedLabel,
  name,
  focusMode,
}) => ({
  id: id,
  name: highlightedLabel || name,
  type: 'modularPipeline',
  icon: 'modularPipeline',
  visibleIcon: VisibleIcon,
  invisibleIcon: InvisibleIcon,
  active: false,
  selected: false,
  faded: false,
  visible: true,
  enabled: true,
  disabled: focusMode && focusMode?.id !== id,
  checked: true,
});

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

  const getNodeRowData = (node) => {
    const checked = !node.disabledNode;
    const disabled = node.disabledTag || node.disabledType;

    return {
      ...node,
      visibleIcon: VisibleIcon,
      invisibleIcon: InvisibleIcon,
      active: false,
      selected: nodeSelected[node.id],
      faded: disabled || node.disabledNode,
      visible: !disabled && checked,
      checked,
      disabled,
    };
  };

  const renderLeafNode = (node) => {
    return (
      <NodeListTreeItem
        data={getNodeRowData(node)}
        onItemMouseEnter={onItemMouseEnter}
        onItemMouseLeave={onItemMouseLeave}
        onItemChange={onItemChange}
        onItemClick={onItemClick}
        key={node.id}
        focusMode={focusMode}
      />
    );
  };

  const renderTree = (tree, modularPipelineID) => {
    const node = tree[modularPipelineID];
    if (!node) {
      return;
    }

    const children = sortBy(
      node.children,
      (child) => GROUPED_NODES_DISPLAY_ORDER[child.type],
      (child) => child.data.name
    ).map((child) =>
      isModularPipelineType(child.type)
        ? renderTree(tree, child.id)
        : renderLeafNode(child.data)
    );

    if (modularPipelineID === '__root__') {
      return children;
    }

    return (
      <NodeListTreeItem
        data={getModularPipelineRowData({
          ...node,
          focusMode,
        })}
        onItemMouseEnter={onItemMouseEnter}
        onItemMouseLeave={onItemMouseLeave}
        onItemChange={onItemChange}
        onItemClick={noop}
        key={node.id}
        focusMode={focusMode}>
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
