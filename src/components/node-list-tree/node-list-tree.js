import React from 'react';
import uniqueId from 'lodash/uniqueId';

import { styled } from '@mui/system';
import { TreeView } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import sortBy from 'lodash/sortBy';

import { isModularPipelineType } from '../../selectors/node-types';
import NodeListTreeItem from './node-list-tree-item/node-list-tree-item';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import FocusModeIcon from '../icons/focus-mode';

import './styles/node-list.scss';

// Display order of node groups
const GROUPED_NODES_DISPLAY_ORDER = {
  modularPipeline: 0,
  task: 1,
  data: 2,
  parameter: 3,
};

// please note that this setup is unique for initialization of the material-ui tree,
// and setup is only used here and not anywhere else in the app.
const StyledTreeView = styled(TreeView)({
  root: {
    height: 110,
    flexGrow: 1,
    maxWidth: 400,
  },
  padding: '0 0 0 20px',
});

/**
 * Return the data of a modular pipeline to display as a row in the node list.
 * @param {Object} params
 * @param {String} params.id The modular pipeline ID
 * @param {String} params.highlightedLabel The modular pipeline name with highlights when matched under search
 * @param {Object} params.data The modular pipeline data to display
 * @param {Boolean} params.disabled Whether the modular pipeline is disabled, e.g. when it's not the focused one
 * @param {Boolean} params.focused Whether the modular pipeline is the focused one in focus mode
 * @return {Object} The modular pipeline's data needed to render as a row in the node list tree.
 */
const getModularPipelineRowData = ({
  id,
  highlightedLabel,
  data,
  disabled,
  focused,
  focusModeIcon,
  highlight,
}) => {
  const checked = !data.disabledModularPipeline;
  return {
    id: id,
    name: highlightedLabel || data.name,
    type: 'modularPipeline',
    icon: 'modularPipeline',
    focusModeIcon: focusModeIcon,
    active: data.active,
    selected: false,
    faded: disabled || !checked,
    visible: !disabled && checked,
    enabled: true,
    disabled: disabled,
    focused: focused,
    checked,
    highlight,
  };
};

/**
 * Return the data of a node to display as a row in the node list
 * @param {Object} node The node to display
 * @param {Boolean} selected Whether the node is currently disabled
 * @param {Boolean} selected Whether the node is currently selected
 */
const getNodeRowData = (node, disabled, hoveredNode, selected, highlight) => {
  const checked = !node.disabledNode;

  return {
    ...node,
    visibleIcon: VisibleIcon,
    invisibleIcon: InvisibleIcon,
    active: node.active || hoveredNode === node.id,
    selected,
    highlight,
    faded: disabled || !checked,
    visible: !disabled && checked,
    checked,
    disabled,
  };
};

const TreeListProvider = ({
  hoveredNode,
  nodeSelected,
  modularPipelinesSearchResult,
  modularPipelinesTree,
  onItemChange,
  onItemMouseEnter,
  onItemMouseLeave,
  onToggleHoveredFocusMode,
  onItemClick,
  onNodeToggleExpanded,
  focusMode,
  expanded,
  onToggleNodeSelected,
  slicedPipeline,
  isSlicingPipelineApplied,
  nodesDisabledViaModularPipeline,
}) => {
  // render a leaf node in the modular pipelines tree
  const renderLeafNode = (node) => {
    // As part of the slicing pipeline logic, child nodes not included in the sliced pipeline are assigned an empty data object.
    // Therefore, if a child node has an empty data object, it indicates it's not part of the slicing pipeline and should not be rendered.
    if (!node || Object.keys(node).length === 0) {
      return null;
    }

    const disabled =
      node.disabledTag ||
      node.disabledType ||
      nodesDisabledViaModularPipeline[node.id];

    const selected = nodeSelected[node.id];
    const highlight = slicedPipeline.includes(node.id);
    const data = getNodeRowData(
      node,
      disabled,
      hoveredNode,
      selected,
      highlight
    );

    return (
      <NodeListTreeItem
        data={data}
        onItemMouseEnter={onItemMouseEnter}
        onItemMouseLeave={onItemMouseLeave}
        onItemChange={onItemChange}
        onToggleHoveredFocusMode={onToggleHoveredFocusMode}
        onItemClick={onItemClick}
        key={uniqueId(node.id)}
        isSlicingPipelineApplied={isSlicingPipelineApplied}
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

    // If all children's data are empty, the subtree rooted at this node will not be rendered.
    // in scenarios where the pipeline is being sliced, and some modular pipelines trees do not have any children
    const allChildrenDataEmpty = node.children.every(
      (child) => Object.keys(child.data).length === 0
    );
    if (allChildrenDataEmpty) {
      return;
    }

    // render each child of the tree node first
    const children = sortBy(
      node.children,
      (child) => GROUPED_NODES_DISPLAY_ORDER[child.type],
      (child) => child?.data?.name
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

    const isFocusedModularPipeline = focusMode?.id === node.id;
    let focusModeIcon;
    if (!focusMode) {
      focusModeIcon = FocusModeIcon;
    } else {
      focusModeIcon = isFocusedModularPipeline ? FocusModeIcon : null;
    }

    const isModularPipelineCollapsed = !expanded.includes(node.id);
    // Highlight modular pipeline if any child node of the current modular pipeline is part of the slicedPipeline and the modular pipeline is collapsed
    const highlight =
      node.children.some((child) => slicedPipeline.includes(child.id)) &&
      isModularPipelineCollapsed;

    const data = getModularPipelineRowData({
      ...node,
      focusModeIcon,
      disabled: nodesDisabledViaModularPipeline[node.id],
      focused: isFocusedModularPipeline,
      highlight,
    });

    return (
      <NodeListTreeItem
        data={data}
        onItemMouseEnter={onItemMouseEnter}
        onItemMouseLeave={onItemMouseLeave}
        onItemChange={onItemChange}
        onToggleHoveredFocusMode={onToggleHoveredFocusMode}
        onItemClick={onItemClick}
        key={uniqueId(node.id)}
        isSlicingPipelineApplied={isSlicingPipelineApplied}
      >
        {children}
      </NodeListTreeItem>
    );
  };

  const onItemExpandCollapseToggle = (event, expandedItemIds) => {
    onNodeToggleExpanded(expandedItemIds);
    //when the parent modular pipeline tree of the selected node is collapsed
    if (expandedItemIds.length === 0) {
      onToggleNodeSelected(null);
    }
  };

  return modularPipelinesSearchResult ? (
    <StyledTreeView
      expanded={Object.keys(modularPipelinesSearchResult)}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      key="modularPipelinesSearchResult"
    >
      {renderTree(modularPipelinesSearchResult, '__root__')}
    </StyledTreeView>
  ) : (
    <StyledTreeView
      expanded={expanded}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      onNodeToggle={onItemExpandCollapseToggle}
      key="modularPipelinesTree"
    >
      {renderTree(modularPipelinesTree, '__root__')}
    </StyledTreeView>
  );
};

export default TreeListProvider;
