import React from 'react';
import { connect } from 'react-redux';

import { makeStyles, withStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import noop from 'lodash.noop';
import sortBy from 'lodash.sortby';

import {
  toggleModularPipelineActive,
  toggleModularPipelineFilter,
} from '../../actions/modular-pipelines';
import { toggleTypeDisabled } from '../../actions/node-type';
import { getNodeSelected } from '../../selectors/nodes';
import { loadNodeData } from '../../actions/nodes';
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
  enabled,
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
  nodes,
  nodeSelected,
  modularPipelinesTree,
  onItemChange,
  onItemMouseEnter,
  onItemMouseLeave,
  onItemClick,
  searching,
  focusMode,
}) => {
  const classes = useStyles();

  const getNodeRowData = (node) => {
    const checked = !node.disabledNode;
    const disabled =
      node.disabledTag || node.disabledType || node.disabledModularPipeline;
    // (focusMode !== null && !!inputOutputDataNodes[node.id]);

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

  const renderModularPipelinesTree = (modularPipelineID) => {
    const node = modularPipelinesTree[modularPipelineID];
    if (!node) {
      return;
    }

    const children = sortBy(
      node.children,
      (child) => GROUPED_NODES_DISPLAY_ORDER[child.type],
      (child) => child.name
    ).map((child) =>
      isModularPipelineType(child.type)
        ? renderModularPipelinesTree(child.id)
        : renderLeafNode(child.node)
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

  return searching ? (
    <StyledTreeView
      className={classes.root}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      // expanded={expandedPipelines}
      key="tree-search">
      {/* render set of modular pipelines in the main pipeline */}
      {/* {renderModularPipelines(treeData, false)} */}
      {/* render set of node elements in the main pipeline */}
      {/* {renderChildNodes(treeData)} */}
      {renderModularPipelinesTree('__root__')}
    </StyledTreeView>
  ) : (
    <StyledTreeView
      className={classes.root}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      key="tree">
      {renderModularPipelinesTree('__root__')}
    </StyledTreeView>
  );
};

export const mapStateToProps = (state) => ({
  nodeSelected: getNodeSelected(state),
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleModularPipelineActive: (modularPipelineIDs, active) => {
    dispatch(toggleModularPipelineActive(modularPipelineIDs, active));
  },
  onToggleModularPipelineFilter: (modularPipelineIDs, enabled) => {
    dispatch(toggleModularPipelineFilter(modularPipelineIDs, enabled));
  },
  onToggleTypeDisabled: (typeID, disabled) => {
    dispatch(toggleTypeDisabled(typeID, disabled));
  },
  onToggleNodeSelected: (nodeID) => {
    dispatch(loadNodeData(nodeID));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(TreeListProvider);
