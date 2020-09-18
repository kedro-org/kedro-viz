import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import utils from '@quantumblack/kedro-ui/lib/utils';
import NodeList from './node-list';
import { getFilteredItems, getGroups } from './node-list-items';
import { toggleTagActive, toggleTagFilter } from '../../actions/tags';
import { toggleTypeDisabled } from '../../actions/node-type';
import { getNodeSections, getNodeTypes } from '../../selectors/node-types';
import { getTagData } from '../../selectors/tags';
import {
  getGroupedNodes,
  getNodeActive,
  getNodeSelected
} from '../../selectors/nodes';
import {
  toggleNodeClicked,
  toggleNodeHovered,
  toggleNodesDisabled
} from '../../actions/nodes';
import './styles/node-list.css';

const isTagType = type => type === 'tag';

/**
 * Wraps a NodeList component and populates it with tags and nodes
 */
const NodeListSource = ({
  nodes,
  nodeSelected,
  nodeActive,
  tags,
  tagsEnabled,
  sections,
  types,
  onToggleNodesDisabled,
  onToggleNodeHovered,
  onToggleNodeClicked,
  onToggleTagActive,
  onToggleTagFilter,
  onToggleTypeDisabled
}) => {
  const [searchValue, updateSearchValue] = useState('');
  const items = getFilteredItems({
    nodes,
    tags,
    tagsEnabled,
    nodeActive,
    nodeSelected,
    searchValue
  });
  const groups = getGroups({ types, items });

  const onItemClick = item => {
    if (isTagType(item.type)) {
      onTagItemChange(item, item.checked);
    } else {
      if (item.disabled || nodeSelected[item.id]) {
        onToggleNodeClicked(null);
      } else {
        onToggleNodeClicked(item.id);
      }
    }
  };

  const onItemChange = (item, checked) => {
    if (isTagType(item.type)) {
      onTagItemChange(item, checked);
    } else {
      if (checked) {
        onToggleNodeHovered(null);
      }

      onToggleNodesDisabled([item.id], checked);
    }
  };

  const onItemMouseEnter = item => {
    if (isTagType(item.type)) {
      onToggleTagActive(item.id, true);
    } else if (item.visible) {
      onToggleNodeHovered(item.id);
    }
  };

  const onItemMouseLeave = item => {
    if (isTagType(item.type)) {
      onToggleTagActive(item.id, false);
    } else if (item.visible) {
      onToggleNodeHovered(null);
    }
  };

  const onToggleGroupChecked = (type, checked) => {
    if (isTagType(type)) {
      // Filter all tags if at least one tag item set, otherwise enable all tags
      const tagItems = items[type] || [];
      const someTagSet = tagItems.some(tagItem => !tagItem.unset);
      const allTagsValue = someTagSet ? undefined : true;
      tagItems.forEach(tag => onToggleTagFilter(tag.id, allTagsValue));
    } else {
      onToggleTypeDisabled(type, checked);
    }
  };

  const onTagItemChange = (tagItem, wasChecked) => {
    const tagItems = items[tagItem.type] || [];
    const oneTagChecked =
      tagItems.filter(tagItem => tagItem.checked).length === 1;
    const shouldResetTags = wasChecked && oneTagChecked;

    if (shouldResetTags) {
      // Unset all tags
      tags.forEach(tag => onToggleTagFilter(tag.id, undefined));
    } else {
      // Toggle the tag
      onToggleTagFilter(tagItem.id, !wasChecked);
    }
  };

  // Deselect node on Escape key
  const handleKeyDown = event => {
    utils.handleKeyEvent(event.keyCode, {
      escape: () => onToggleNodeClicked(null)
    });
  };
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <NodeList
      items={items}
      sections={sections}
      groups={groups}
      searchValue={searchValue}
      onUpdateSearchValue={updateSearchValue}
      onToggleGroupChecked={onToggleGroupChecked}
      onItemClick={onItemClick}
      onItemMouseEnter={onItemMouseEnter}
      onItemMouseLeave={onItemMouseLeave}
      onItemChange={onItemChange}
    />
  );
};

export const mapStateToProps = state => ({
  tags: getTagData(state),
  tagsEnabled: state.tag.enabled,
  nodes: getGroupedNodes(state),
  nodeSelected: getNodeSelected(state),
  nodeActive: getNodeActive(state),
  sections: getNodeSections(state),
  types: getNodeTypes(state)
});

export const mapDispatchToProps = dispatch => ({
  onToggleTagActive: (tagID, active) => {
    dispatch(toggleTagActive(tagID, active));
  },
  onToggleTagFilter: (tagID, enabled) => {
    dispatch(toggleTagFilter(tagID, enabled));
  },
  onToggleTypeDisabled: (typeID, disabled) => {
    dispatch(toggleTypeDisabled(typeID, disabled));
  },
  onToggleNodeClicked: nodeID => {
    dispatch(toggleNodeClicked(nodeID));
  },
  onToggleNodeHovered: nodeID => {
    dispatch(toggleNodeHovered(nodeID));
  },
  onToggleNodesDisabled: (nodeIDs, disabled) => {
    dispatch(toggleNodesDisabled(nodeIDs, disabled));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NodeListSource);
