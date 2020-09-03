import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import utils from '@quantumblack/kedro-ui/lib/utils';
import { loadState, saveState } from '../../store/helpers';
import { getNodeActive, getNodeSelected } from '../../selectors/nodes';
import { getNodeSections } from '../../selectors/node-types';
import NodeListGroup from './node-list-group';
import NodeListRow from './node-list-row';
import { toggleTagFilter } from '../../actions/tags';
import { toggleTypeDisabled } from '../../actions/node-type';
import {
  toggleNodeClicked,
  toggleNodeHovered,
  toggleNodesDisabled
} from '../../actions/nodes';

const storedState = loadState();

const getNodeState = node => {
  const checked =
    typeof node.checked !== 'undefined' ? node.checked : !node.disabled_node;
  const disabled = node.disabled_tag || node.disabled_type;
  const faded = node.disabled_node || disabled;
  const visible =
    typeof node.visible !== 'undefined' ? node.visible : !disabled && checked;
  return { checked, disabled, faded, visible };
};

const NodeListGroups = ({
  onToggleTypeDisabled,
  onToggleNodeClicked,
  onToggleNodesDisabled,
  onToggleNodeHovered,
  onToggleTagFilter,
  nodes,
  nodeActive,
  nodeSelected,
  sections,
  searchValue
}) => {
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

  const [collapsed, setCollapsed] = useState(storedState.groupsCollapsed || {});

  // Collapse/expand node group
  const onToggleGroupCollapsed = typeID => {
    const groupsCollapsed = Object.assign({}, collapsed, {
      [typeID]: !collapsed[typeID]
    });
    setCollapsed(groupsCollapsed);
    saveState({ groupsCollapsed });
  };

  // Toggle node selection depending on whether it's already selected
  const handleNodeSelection = node => {
    if (node.disabled || nodeSelected[node.id]) {
      onToggleNodeClicked(null);
    } else {
      onToggleNodeClicked(node.id);
    }
  };

  const renderTypeGroup = type => {
    const nodesOfType = nodes[type.id] || [];
    const groupAllUnset = nodesOfType.every(node => node.unset);

    let groupVisibleIcon;
    let groupInvisibleIcon;
    let groupChecked = !type.disabled;
    let onToggleGroupChecked = onToggleTypeDisabled;

    if (type.id === 'tag') {
      const groupAllChecked = nodesOfType.every(node => node.checked);
      onToggleGroupChecked = () => {
        const allTagsValue = groupAllUnset ? true : undefined;
        nodesOfType.forEach(tag => onToggleTagFilter(tag.id, allTagsValue));
      };
      groupChecked = !groupAllUnset;
      groupVisibleIcon = groupAllChecked ? 'indicator' : 'indicatorPartial';
      groupInvisibleIcon = 'indicatorOff';
    }

    return (
      <NodeListGroup
        key={type.id}
        onToggleCollapsed={onToggleGroupCollapsed}
        onToggleChecked={onToggleGroupChecked}
        type={type}
        checked={groupChecked}
        childCount={nodesOfType.length}
        allUnset={groupAllUnset}
        visibleIcon={groupVisibleIcon}
        invisibleIcon={groupInvisibleIcon}
        collapsed={Boolean(searchValue) ? false : collapsed[type.id]}>
        <ul className="pipeline-nodelist pipeline-nodelist--nested">
          {nodesOfType.map(node => {
            const { checked, disabled, faded, visible } = getNodeState(node);
            return (
              <li key={node.id}>
                <NodeListRow
                  active={nodeActive[node.id]}
                  checked={checked}
                  unset={node.unset}
                  disabled={disabled}
                  faded={faded}
                  visible={visible}
                  id={node.id}
                  label={node.highlightedLabel}
                  name={node.name}
                  selected={nodeSelected[node.id]}
                  type={node.type}
                  visibleIcon={node.visibleIcon}
                  invisibleIcon={node.invisibleIcon}
                  onClick={() => {
                    if (node.onClick) {
                      node.onClick(node, checked);
                      return;
                    }

                    handleNodeSelection(node);
                  }}
                  onMouseEnter={() => {
                    if (node.onMouseEnter) {
                      node.onMouseEnter(node);
                      return;
                    }

                    if (visible) {
                      onToggleNodeHovered(node.id);
                    }
                  }}
                  onMouseLeave={() => {
                    if (node.onMouseLeave) {
                      node.onMouseLeave(node);
                      return;
                    }

                    if (visible) {
                      onToggleNodeHovered(null);
                    }
                  }}
                  onChange={e => {
                    if (node.onChange) {
                      node.onChange(node, !e.target.checked);
                      return;
                    }

                    if (!e.target.checked) {
                      onToggleNodeHovered(null);
                    }

                    onToggleNodesDisabled([node.id], !e.target.checked);
                  }}
                />
              </li>
            );
          })}
        </ul>
      </NodeListGroup>
    );
  };

  return (
    <>
      {sections.map(section => (
        <nav className="pipeline-nodelist-section kedro" key={section.name}>
          <h4 className="pipeline-nodelist-section__title">{section.name}</h4>
          <ul className="pipeline-nodelist">
            {section.types.map(renderTypeGroup)}
          </ul>
        </nav>
      ))}
    </>
  );
};

export const mapStateToProps = state => ({
  nodeActive: getNodeActive(state),
  nodeSelected: getNodeSelected(state),
  sections: getNodeSections(state)
});

export const mapDispatchToProps = dispatch => ({
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
)(NodeListGroups);
