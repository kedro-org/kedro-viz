import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { getGroupedNodes } from '../../selectors/nodes';
import { getFilteredNodes, highlightMatch, filterNodes } from './filter-nodes';
import NodeListSearch from './node-list-search';
import NodeListGroups from './node-list-groups';
import { toggleTagActive, toggleTagFilter } from '../../actions/tags';
import { toggleTypeDisabled } from '../../actions/node-type';
import { toggleNodeClicked } from '../../actions/nodes';
import { getTagData } from '../../selectors/tags';
import './styles/node-list.css';

/**
 * Scrollable list of toggleable nodes, with search & filter functionality
 */
const NodeList = ({
  nodes,
  onToggleTagActive,
  onToggleTagFilter,
  onToggleNodeClicked,
  onToggleTypeDisabled,
  tags,
  tagsEnabled
}) => {
  const [searchValue, updateSearchValue] = useState('');
  const { filteredNodes } = getFilteredNodes({ nodes, searchValue });

  const onTagChange = (tag, checked) => {
    const valuesBefore = Object.values(tagsEnabled).filter(
      enabled => enabled !== undefined
    );
    const valuesAfter = Object.values({ ...tagsEnabled, [tag.id]: !checked });
    const firstEnabled =
      valuesBefore.filter(enabled => enabled === false).length === 0;
    const allDisabled =
      valuesAfter.filter(enabled => enabled === false).length === tags.length;
    const someEnabled =
      valuesAfter.filter(enabled => enabled === false).length !== tags.length;

    tags.forEach(tag => onToggleTagActive(tag.id, false));
    onToggleNodeClicked(null);
    onToggleTypeDisabled('tag', !someEnabled);

    if (firstEnabled) {
      tags.forEach(tag => onToggleTagFilter(tag.id, false));
      onToggleTagFilter(tag.id, true);
    } else if (allDisabled) {
      tags.forEach(tag => onToggleTagFilter(tag.id, true));
    } else {
      onToggleTagFilter(tag.id, !checked);
      onToggleTagActive(tag.id, !checked);
    }
  };

  const onTagEnter = tag => {
    onToggleTagActive(tag.id, true);
  };

  const onTagLeave = tag => {
    onToggleTagActive(tag.id, false);
  };

  const onToggleTagTypeDisabled = (type, checked) => {
    onToggleTypeDisabled(type, checked);

    tags.forEach(tag => {
      onToggleTagActive(tag.id, !checked);
      onToggleTagFilter(tag.id, !checked);
    });
  };

  const tagNodes = tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    type: 'tag',
    disabled: false,
    disabled_node: tagsEnabled[tag.id] === false,
    disabled_tag: false,
    disabled_type: false,
    onClick: () => {},
    onChange: onTagChange,
    onMouseEnter: onTagEnter,
    onMouseLeave: onTagLeave,
    onToggleTypeDisabled: onToggleTagTypeDisabled
  }));

  const filteredTagNodes = highlightMatch(
    filterNodes({ tag: tagNodes }, searchValue),
    searchValue
  );

  const sortByEnabledThenAlpha = (a, b) => {
    const byEnabledTag = Number(a.disabled_tag) - Number(b.disabled_tag);
    const byAlpha = a.name.localeCompare(b.name);
    return byEnabledTag !== 0 ? byEnabledTag : byAlpha;
  };

  for (const nodes of Object.values(filteredNodes)) {
    nodes.sort(sortByEnabledThenAlpha);
  }

  const allNodes = {
    ...filteredTagNodes,
    ...filteredNodes
  };

  return (
    <React.Fragment>
      <NodeListSearch
        onUpdateSearchValue={updateSearchValue}
        searchValue={searchValue}
      />
      <Scrollbars
        className="pipeline-nodelist-scrollbars"
        style={{ width: 'auto' }}
        autoHide
        hideTracksWhenNotNeeded>
        <div className="pipeline-nodelist-container">
          <NodeListGroups nodes={allNodes} searchValue={searchValue} />
        </div>
      </Scrollbars>
    </React.Fragment>
  );
};

export const mapStateToProps = state => {
  const tagsEnabled = state.tag.enabled;
  const tags = getTagData(state);
  const nodes = getGroupedNodes(state);
  return {
    tags,
    tagsEnabled,
    nodes
  };
};

export const mapDispatchToProps = dispatch => ({
  onToggleTagActive: (tagID, active) => {
    dispatch(toggleTagActive(tagID, active));
  },
  onToggleTagFilter: (tagID, enabled) => {
    dispatch(toggleTagFilter(tagID, enabled));
  },
  onToggleNodeClicked: nodeID => {
    dispatch(toggleNodeClicked(nodeID));
  },
  onToggleTypeDisabled: (typeID, disabled) => {
    dispatch(toggleTypeDisabled(typeID, disabled));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NodeList);
