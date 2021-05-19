import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
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
import {
  getModularPipelineIDs,
  getModularPipelineData,
  // getModularPipelineNodes,
  // getNestedModularPipelines,
} from '../../selectors/modular-pipelines';
import {
  getFilteredModularPipelineNodes,
  getNestedModularPipelines,
  getFilteredTreeItems,
} from './tree-list-items';
import {
  getGroupedNodes,
  getNodeSelected,
  getNodeModularPipelines,
} from '../../selectors/nodes';
import {
  loadNodeData,
  toggleNodeHovered,
  toggleNodesDisabled,
} from '../../actions/nodes';
import TreeListSearch from './tree-list-search';
import './styles/tree-list.css';

const useStyles = makeStyles({
  root: {
    height: 110,
    flexGrow: 1,
    maxWidth: 400,
  },
});

const isModularPipelineType = (type) => type === 'modularPipeline';

const TreeListProvider = ({
  faded,
  nodes,
  nodeSelected,
  onToggleNodeSelected,
  searchValue,
  updateSearchValue,
  modularPipelines,
  modularPipelineIds,
  nodeModularPipelines,
}) => {
  const classes = useStyles();
  console.log('grouped nodes', nodes);

  console.log('searchValue', searchValue);

  const items = getFilteredTreeItems({
    nodes,
    modularPipelines,
    nodeSelected,
    searchValue,
  });

  const treeData = getNestedModularPipelines({
    nodes,
    modularPipelines,
    nodeSelected,
    searchValue,
    modularPipelineIds,
    nodeModularPipelines,
  });

  console.log('treeData', treeData);

  const onItemClick = (item) => {
    if (!isModularPipelineType(item.type)) {
      onToggleNodeSelected(item.id);
    }
  };

  const renderTree = (rowData) => {
    return (
      <TreeItem key={rowData.id} nodeId={rowData.id} label={rowData.name}>
        {rowData.children.length > 0 &&
          rowData.children.map((node) => renderTree(node))}

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
  };

  return (
    <div
      className={classnames('pipeline-nodelist', {
        'pipeline-nodelist--fade': faded,
      })}>
      <TreeListSearch
        onUpdateSearchValue={updateSearchValue}
        searchValue={searchValue}
      />
      <Scrollbars
        className="pipeline-nodelist-scrollbars"
        style={{ width: 'auto' }}
        autoHide
        hideTracksWhenNotNeeded>
        <TreeView
          className={classes.root}
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpanded={['main']}
          defaultExpandIcon={<ChevronRightIcon />}>
          {renderTree(treeData)}
        </TreeView>
      </Scrollbars>
    </div>
  );
};

export const mapStateToProps = (state) => ({
  nodes: getGroupedNodes(state),
  nodeSelected: getNodeSelected(state),
  nodeModularPipelines: getNodeModularPipelines(state),
  types: getNodeTypes(state),
  modularPipelineIds: getModularPipelineIDs(state),
  modularPipelines: getModularPipelineData(state),
  // modularPipelineNodes: getFilteredModularPipelineNodes(state),
  // treeData: getNestedModularPipelines(state),
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
