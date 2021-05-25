import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import utils from '@quantumblack/kedro-ui/lib/utils';

import { makeStyles, withStyles } from '@material-ui/core/styles';
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
import { getNestedModularPipelines } from './node-list-items';
import {
  getGroupedNodes,
  getNodeSelected,
  getNodeModularPipelines,
} from '../../selectors/nodes';
import { loadNodeData } from '../../actions/nodes';
import NodeListRow from './node-list-row';

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
  faded,
  nodes,
  nodeSelected,
  onToggleNodeSelected,
  searchValue,
  updateSearchValue,
  modularPipelines,
  modularPipelineIds,
  nodeModularPipelines,
  onItemChange,
  onItemMouseEnter,
  onItemMouseLeave,
}) => {
  const classes = useStyles();

  console.log('searchValue', searchValue);

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

  const renderTree = (
    rowData,
    onItemMouseEnter,
    onItemMouseLeave,
    onItemChange,
    onItemClick
  ) => {
    return (
      <TreeItem
        key={rowData.id}
        nodeId={rowData.id}
        label={
          <NodeListRow
            container="li"
            key={rowData.id}
            id={rowData.id}
            kind="element"
            label={rowData.name}
            name={rowData.name}
            type={rowData.type}
            active={rowData.active}
            checked={rowData.checked}
            disabled={rowData.disabled}
            faded={rowData.faded}
            visible={rowData.visible}
            selected={rowData.selected}
            unset={rowData.unset}
            allUnset={true}
            visibleIcon={rowData.visibleIcon}
            invisibleIcon={rowData.invisibleIcon}
            onClick={() => onItemClick(rowData)}
            onMouseEnter={() => onItemMouseEnter(rowData)}
            onMouseLeave={() => onItemMouseLeave(rowData)}
            onChange={(e) => onItemChange(rowData, !e.target.checked)}
            rowType="tree"
          />
        }>
        {rowData.children.length > 0 &&
          rowData.children.map((node) =>
            renderTree(
              node,
              onItemMouseEnter,
              onItemMouseLeave,
              onItemChange,
              onItemClick
            )
          )}

        {/* render set of node elements in that modular pipeline */}
        {rowData.nodes.map((node) => (
          <TreeItem
            key={node.id}
            nodeId={node.id}
            label={
              <NodeListRow
                container="li"
                key={node.id}
                id={node.id}
                kind="element"
                label={node.name}
                name={node.name}
                type={node.type}
                active={node.active}
                checked={node.checked}
                disabled={node.disabled}
                faded={node.faded}
                visible={node.visible}
                selected={node.selected}
                unset={node.unset}
                allUnset={true}
                visibleIcon={node.visibleIcon}
                invisibleIcon={node.invisibleIcon}
                onClick={() => onItemClick(node)}
                onMouseEnter={() => onItemMouseEnter(node)}
                onMouseLeave={() => onItemMouseLeave(node)}
                onChange={(e) => onItemChange(node, !e.target.checked)}
                rowType="tree"
              />
            }
          />
        ))}
      </TreeItem>
    );
  };

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
            onItemClick
          )
        )}

      {treeData.nodes.map((node) => (
        <TreeItem
          key={node.id}
          nodeId={node.id}
          label={
            <NodeListRow
              container="li"
              key={node.id}
              id={node.id}
              kind="element"
              label={node.name}
              name={node.name}
              type={node.type}
              active={node.active}
              checked={node.checked}
              disabled={node.disabled}
              faded={node.faded}
              visible={node.visible}
              selected={node.selected}
              unset={node.unset}
              allUnset={true}
              visibleIcon={node.visibleIcon}
              invisibleIcon={node.invisibleIcon}
              onClick={() => onItemClick(node)}
              onMouseEnter={() => onItemMouseEnter(node)}
              onMouseLeave={() => onItemMouseLeave(node)}
              onChange={(e) => onItemChange(node, !e.target.checked)}
              rowType="tree"
            />
          }
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
});

export default connect(mapStateToProps, mapDispatchToProps)(TreeListProvider);
