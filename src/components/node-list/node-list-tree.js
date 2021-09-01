import React, { useState, useEffect } from 'react';
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
  getFilteredTreeItems,
} from './node-list-items';
import {
  getGroupedNodes,
  getNodeSelected,
  getNodeModularPipelines,
  getInputOutputNodesForFocusedModularPipeline,
} from '../../selectors/nodes';
import { loadNodeData } from '../../actions/nodes';
import NodeListTreeItem from './node-list-tree-item';

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
  searching,
  focusMode,
  inputOutputDataNodes,
}) => {
  const classes = useStyles();

  const [expandedPipelines, setExpandedPipelines] = useState([]);

  useEffect(() => {
    const filteredTreeItems =
      searchValue !== ''
        ? getFilteredTreeItems({
            nodes,
            modularPipelines,
            nodeSelected,
            searchValue,
            modularPipelineIds,
            nodeModularPipelines,
            nodeTypeIDs,
            focusMode,
            inputOutputDataNodes,
          })
        : [];

    let expandedModularPipelines = [];

    searchValue !== '' &&
      filteredTreeItems.forEach((modularPipeline) =>
        expandedModularPipelines.push(modularPipeline.id)
      );
    setExpandedPipelines(expandedModularPipelines);
  }, [
    searchValue,
    nodes,
    modularPipelines,
    nodeSelected,
    modularPipelineIds,
    nodeModularPipelines,
    nodeTypeIDs,
    focusMode,
    inputOutputDataNodes,
  ]);

  const treeData = getNestedModularPipelines({
    nodes,
    modularPipelines,
    nodeSelected,
    searchValue,
    modularPipelineIds,
    nodeModularPipelines,
    nodeTypeIDs,
    focusMode,
    inputOutputDataNodes,
  });

  const onItemClick = (item) => {
    if (!isModularPipelineType(item.type)) {
      onToggleNodeSelected(item.id);
    }
  };

  const renderModularPipelines = (treeData, parentStatus) => {
    // this value is needed to determine whether the children modular pipeline belongs to a parent under focusMode
    const status =
      parentStatus === false && treeData.id !== 'main'
        ? parentStatus
        : treeData.disabled;

    return treeData.children.map((node) =>
      renderTree(
        node,
        onItemMouseEnter,
        onItemMouseLeave,
        onItemChange,
        onItemClick,
        status,
        treeData.id
      )
    );
  };

  const renderChildNodes = (treeData) =>
    treeData.nodes.map((node) => (
      <NodeListTreeItem
        data={node}
        onItemMouseEnter={onItemMouseEnter}
        onItemMouseLeave={onItemMouseLeave}
        onItemChange={onItemChange}
        onItemClick={onItemClick}
        key={node.id}
        focusMode={focusMode}
      />
    ));

  const renderTree = (
    rowData,
    onItemMouseEnter,
    onItemMouseLeave,
    onItemChange,
    onItemClick,
    parentDisabled,
    parentPipeline
  ) => (
    <NodeListTreeItem
      data={rowData}
      onItemMouseEnter={onItemMouseEnter}
      onItemMouseLeave={onItemMouseLeave}
      onItemChange={onItemChange}
      onItemClick={onItemClick}
      key={rowData.id}
      focusMode={focusMode}
      parentPipeline={parentPipeline}
      parentDisabled={parentDisabled}>
      {renderModularPipelines(rowData, parentDisabled)}

      {/* render set of node elements in that modular pipeline */}
      {renderChildNodes(rowData)}
    </NodeListTreeItem>
  );

  return searching ? (
    <StyledTreeView
      className={classes.root}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      expanded={expandedPipelines}
      key="tree-search">
      {/* render set of modular pipelines in the main pipeline */}
      {renderModularPipelines(treeData, false)}
      {/* render set of node elements in the main pipeline */}
      {renderChildNodes(treeData)}
    </StyledTreeView>
  ) : (
    <StyledTreeView
      className={classes.root}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      key="tree">
      {renderModularPipelines(treeData, false)}
      {renderChildNodes(treeData)}
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
  inputOutputDataNodes: getInputOutputNodesForFocusedModularPipeline(state),
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
