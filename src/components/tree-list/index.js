import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import utils from '@quantumblack/kedro-ui/lib/utils';

import { makeStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';

import {
  toggleModularPipelineActive,
  toggleModularPipelineFilter,
} from '../../actions/modular-pipelines';
import { toggleTypeDisabled } from '../../actions/node-type';
import { getNodeTypes } from '../../selectors/node-types';
// import {
//   getModularPipelineData,
//   getModularPipelineNodes,
//   getNestedModularPipelines,
// } from '../../selectors/modular-pipelines';
import {
  getModularPipelineData,
  getModularPipelineNodes,
  getNestedModularPipelines,
} from './tree-list-items';
import { getGroupedNodes, getNodeSelected } from '../../selectors/nodes';
import {
  loadNodeData,
  toggleNodeHovered,
  toggleNodesDisabled,
} from '../../actions/nodes';
import './styles/tree-list.css';

const useStyles = makeStyles({
  root: {
    height: 110,
    flexGrow: 1,
    maxWidth: 400,
  },
});

const isModularPipelineType = (type) => type === 'modularPipeline';

const TreeListProvider = ({ onToggleNodeSelected, treeData }) => {
  const classes = useStyles();
  console.log('treeData', treeData);

  const onItemClick = (item) => {
    if (!isModularPipelineType(item.type)) {
      onToggleNodeSelected(item.id);
    }
  };

  const renderTree = (rowData) => (
    <TreeItem key={rowData.id} nodeId={rowData.id} label={rowData.name}>
      {Array.isArray(rowData.children)
        ? rowData.children.map((node) => renderTree(node))
        : null}

      {/* render set of node elements in that modular pipeline */}
      {rowData.nodes.map((node) => (
        <TreeItem
          key={node.id}
          nodeId={node.id}
          label={node.name}
          onLabelClick={() => onItemClick(node)}
        />
      ))}
    </TreeItem>
  );

  return (
    <TreeView
      className={classes.root}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpanded={['main']}
      defaultExpandIcon={<ChevronRightIcon />}>
      {renderTree(treeData)}
    </TreeView>
  );
};

export const mapStateToProps = (state) => ({
  nodes: getGroupedNodes(state),
  nodeSelected: getNodeSelected(state),
  types: getNodeTypes(state),
  modularPipelines: getModularPipelineData(state),
  modularPipelineNodes: getModularPipelineNodes(state),
  treeData: getNestedModularPipelines(state),
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
  onToggleNodeActive: (nodeID) => {
    dispatch(toggleNodeHovered(nodeID));
  },
  onToggleNodesDisabled: (nodeIDs, disabled) => {
    dispatch(toggleNodesDisabled(nodeIDs, disabled));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(TreeListProvider);
