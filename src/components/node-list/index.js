import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import utils from '@quantumblack/kedro-ui/lib/utils';
import NodeList from './node-list';
import { getFilteredNodes, highlightMatch, filterNodes } from './filter-nodes';
import { toggleTagActive, toggleTagFilter } from '../../actions/tags';
import { toggleTypeDisabled } from '../../actions/node-type';
import {
  getGroupedNodes,
  getNodeActive,
  getNodeSelected
} from '../../selectors/nodes';
import { getNodeSections, getNodeTypes } from '../../selectors/node-types';
import { getTagData } from '../../selectors/tags';
import {
  toggleNodeClicked,
  toggleNodeHovered,
  toggleNodesDisabled
} from '../../actions/nodes';
import './styles/node-list.css';

const isTagType = type => type === 'tag';

const sortByEnabledThenAlpha = (a, b) => {
  const byEnabledTag = Number(a.disabled_tag) - Number(b.disabled_tag);
  const byAlpha = a.name.localeCompare(b.name);
  return byEnabledTag !== 0 ? byEnabledTag : byAlpha;
};

/**
 * Provides items for the sidebar
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
  const { filteredNodes } = getFilteredNodes({ nodes, searchValue });
  const filteredTags = highlightMatch(
    filterNodes({ tag: tags }, searchValue),
    searchValue
  );

  const items = {
    tag: filteredTags.tag.map(tag => ({
      ...tag,
      type: 'tag',
      visibleIcon: 'indicator',
      invisibleIcon: 'indicatorOff',
      active: false,
      selected: false,
      faded: false,
      visible: true,
      disabled: false,
      unset: typeof tagsEnabled[tag.id] === 'undefined',
      checked: tagsEnabled[tag.id] === true
    })),
    ...Object.keys(filteredNodes).reduce((result, type) => {
      result[type] = filteredNodes[type]
        .sort(sortByEnabledThenAlpha)
        .map(node => {
          const checked = !node.disabled_node;
          const disabled = node.disabled_tag || node.disabled_type;
          return {
            ...node,
            visibleIcon: 'visible',
            invisibleIcon: 'invisible',
            active: nodeActive[node.id],
            selected: nodeSelected[node.id],
            faded: node.disabled_node || disabled,
            visible: !disabled && checked,
            unset: false,
            checked,
            disabled
          };
        });
      return result;
    }, {})
  };

  const groups = types.reduce((groups, type) => {
    const itemsOfType = items[type.id];
    const group = (groups[type.id] = {
      type,
      id: type.id,
      kind: 'toggle',
      visibleIcon: 'visible',
      invisibleIcon: 'invisible',
      checked: !type.disabled,
      count: itemsOfType.length,
      allUnset: itemsOfType.every(item => item.unset),
      allChecked: itemsOfType.every(item => item.checked)
    });

    if (isTagType(type.id)) {
      Object.assign(group, {
        kind: 'filter',
        checked: !group.allUnset,
        visibleIcon: group.allChecked ? 'indicator' : 'indicatorPartial',
        invisibleIcon: 'indicatorOff'
      });
    }

    return groups;
  }, {});

  const onItemClick = item => {
    if (isTagType(item.type)) {
      onTagChange(item, item.checked);
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
      onTagChange(item, checked);
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
    } else {
      if (item.visible) {
        onToggleNodeHovered(item.id);
      }
    }
  };

  const onItemMouseLeave = item => {
    if (isTagType(item.type)) {
      onToggleTagActive(item.id, false);
    } else {
      if (item.visible) {
        onToggleNodeHovered(null);
      }
    }
  };

  const onToggleGroupChecked = (type, checked) => {
    if (isTagType(type)) {
      const itemsOfType = items[type] || [];
      const groupAllUnset = itemsOfType.every(item => item.unset);
      const allTagsValue = groupAllUnset ? true : undefined;
      itemsOfType.forEach(tag => onToggleTagFilter(tag.id, allTagsValue));
    } else {
      onToggleTypeDisabled(type, checked);
    }
  };

  const onTagChange = (tag, checked) => {
    const valuesBefore = Object.values(tagsEnabled);
    const valuesAfter = Object.values({ ...tagsEnabled, [tag.id]: !checked });
    const firstEnabled =
      valuesBefore.filter(enabled => enabled !== undefined).length === 0;
    const allDisabled =
      valuesAfter.filter(enabled => enabled === false).length === tags.length;

    tags.forEach(tag => onToggleTagActive(tag.id, false));
    onToggleNodeClicked(null);

    if (firstEnabled) {
      tags.forEach(tag => onToggleTagFilter(tag.id, false));
      onToggleTagFilter(tag.id, true);
    } else if (allDisabled) {
      tags.forEach(tag => onToggleTagFilter(tag.id, undefined));
    } else {
      onToggleTagFilter(tag.id, !checked);
      onToggleTagActive(tag.id, !checked);
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
