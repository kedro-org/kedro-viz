import React from 'react';
import { connect } from 'react-redux';

import { makeStyles, withStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import {
  toggleModularPipelineActive,
  toggleModularPipelineFilter,
} from '../../actions/modular-pipelines';
import { toggleTypeDisabled } from '../../actions/node-type';
import { getNodeTypes, getNodeTypeIDs } from '../../selectors/node-types';
import {
  getModularPipelineIDs,
  getModularPipelineData,
} from '../../selectors/modular-pipelines';
import {
  getNestedModularPipelines,
  getTreeSearchValueCount,
} from './node-list-items';
import {
  getGroupedNodes,
  getNodeSelected,
  getNodeModularPipelines,
} from '../../selectors/nodes';
import { loadNodeData } from '../../actions/nodes';
import NodeListTreeItem from './node-list-tree-item';

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

const TreeListProvider = ({
  nodes,
  nodeSelected,
  onToggleNodeSelected,
  searchValue,
  modularPipelines,
  modularPipelineIds,
  nodeModularPipelines,
  onItemChange,
  onItemMouseEnter,
  onItemMouseLeave,
  nodeTypeIDs,
}) => {
  const classes = useStyles();

  const treeData = getNestedModularPipelines({
    nodes,
    modularPipelines,
    nodeSelected,
    searchValue,
    modularPipelineIds,
    nodeModularPipelines,
    nodeTypeIDs,
  });

  const searchTreeCount = getTreeSearchValueCount({ treeData, searchValue });

  const onItemClick = (item) => {
    if (!isModularPipelineType(item.type)) {
      onToggleNodeSelected(item.id);
    }
  };

  const renderTree = (
    rowData,
    onItemMouseEnter,
    onItemMouseLeave,
    onItemChange,
    onItemClick,
    searchTreeCount
  ) => (
    <NodeListTreeItem
      data={rowData}
      onItemMouseEnter={onItemMouseEnter}
      onItemMouseLeave={onItemMouseLeave}
      onItemChange={onItemChange}
      onItemClick={onItemClick}
      key={rowData.id}
      searchCount={searchTreeCount[rowData.id]}>
      {rowData.children.length > 0 &&
        rowData.children.map((node) =>
          renderTree(
            node,
            onItemMouseEnter,
            onItemMouseLeave,
            onItemChange,
            onItemClick,
            searchTreeCount
          )
        )}

      {/* render set of node elements in that modular pipeline */}
      {rowData.nodes.map((node) => (
        <NodeListTreeItem
          data={node}
          onItemMouseEnter={onItemMouseEnter}
          onItemMouseLeave={onItemMouseLeave}
          onItemChange={onItemChange}
          onItemClick={onItemClick}
          key={node.id}
        />
      ))}
    </NodeListTreeItem>
  );

  return (
    <StyledTreeView
      className={classes.root}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}>
      {treeData.children.length > 0 &&
        treeData.children.map((node) =>
          renderTree(
            node,
            onItemMouseEnter,
            onItemMouseLeave,
            onItemChange,
            onItemClick,
            searchTreeCount
          )
        )}

      {/* render set of node elements in the main pipeline */}
      {treeData.nodes.map((node) => (
        <NodeListTreeItem
          data={node}
          onItemMouseEnter={onItemMouseEnter}
          onItemMouseLeave={onItemMouseLeave}
          onItemChange={onItemChange}
          onItemClick={onItemClick}
          key={node.id}
        />
      ))}
    </StyledTreeView>
  );
};

export const mapStateToProps = (state) => ({
  nodes: getGroupedNodes(state),
  nodeSelected: getNodeSelected(state),
  nodeModularPipelines: getNodeModularPipelines(state),
  types: getNodeTypes(state),
  nodeTypeIDs: getNodeTypeIDs(state),
  modularPipelineIds: getModularPipelineIDs(state),
  modularPipelines: getModularPipelineData(state),
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
