import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { getGroupedNodes } from '../../selectors/nodes';
import getFilteredNodes from './filter-nodes';
import NodeListSearch from './node-list-search';
import NodeListGroups from './node-list-groups';
import { toggleTagActive, toggleTagFilter } from '../../actions/tags';
import { getTagData } from '../../selectors/tags';
import './styles/node-list.css';

/**
 * Scrollable list of toggleable nodes, with search & filter functionality
 */
const NodeList = ({
  nodes,
  onToggleTagActive,
  onToggleTagFilter,
  tags,
  tagsEnabled
}) => {
  const [searchValue, updateSearchValue] = useState('');
  const { filteredNodes } = getFilteredNodes({ nodes, searchValue });

  const onTagChange = (tag, checked) => {
    onToggleTagActive(tag.id, false);
    onToggleTagFilter(tag.id, !checked);
  };

  const onTagEnter = tag => {
    onToggleTagActive(tag.id, true);
  };

  const onTagLeave = tag => {
    onToggleTagActive(tag.id, false);
  };

  const onTagClick = tagClicked => {
    const wasEnabled = tagsEnabled[tagClicked.id] === true;

    if (wasEnabled) {
      tags.forEach(tag => {
        onToggleTagActive(tag.id, false);
        onToggleTagFilter(tag.id, undefined);
      });
    } else {
      tags.forEach(tag => {
        onToggleTagActive(tag.id, false);
        onToggleTagFilter(tag.id, false);
      });

      onToggleTagActive(tagClicked.id, false);
      onToggleTagFilter(tagClicked.id, true);
    }
  };

  const tagNodes = {
    tag: tags.map(tag => ({
      highlightedLabel: tag.name,
      id: tag.id,
      name: tag.name,
      type: 'tag',
      disabled: false,
      disabled_node: tagsEnabled[tag.id] === false,
      disabled_tag: false,
      disabled_type: false,
      onChange: onTagChange,
      onMouseEnter: onTagEnter,
      onMouseLeave: onTagLeave,
      onClick: onTagClick
    }))
  };

  const sortByEnabledAlpha = (a, b) => {
    const first = Number(a.disabled) - Number(b.disabled);
    return first !== 0 ? first : a.name.localeCompare(b.name);
  };

  for (const nodes of Object.values(filteredNodes)) {
    nodes.sort(sortByEnabledAlpha);
  }

  const allNodes = {
    ...tagNodes,
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
          <NodeListGroups nodes={allNodes} />
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
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NodeList);
