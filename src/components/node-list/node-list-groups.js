import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import utils from '@quantumblack/kedro-ui/lib/utils';
import { loadState, saveState } from '../../store/helpers';
import { getNodeActive, getNodeSelected } from '../../selectors/nodes';
import { getNodeTypes } from '../../selectors/node-types';
import NodeListGroup from './node-list-group';
import NodeListRow from './node-list-row';
import {
  toggleNodeClicked,
  toggleNodeHovered,
  toggleNodesDisabled
} from '../../actions/nodes';

const storedState = loadState();

const NodeListGroups = ({
  onToggleNodeClicked,
  onToggleNodesDisabled,
  onToggleNodeHovered,
  nodes,
  nodeActive,
  nodeSelected,
  types,
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
  const onToggleCollapsed = typeID => {
    const groupsCollapsed = Object.assign({}, collapsed, {
      [typeID]: !collapsed[typeID]
    });
    setCollapsed(groupsCollapsed);
    saveState({ groupsCollapsed });
  };

  // Toggle node selection depending on whether it's already selected
  const handleNodeSelection = node => {
    if (nodeSelected[node.id]) {
      onToggleNodeClicked(null);
    } else {
      onToggleNodeClicked(node.id);
    }
  };

  const renderTypeGroup = type => {
    const nodesOfType = nodes[type.id];

    if (!nodesOfType) {
      return null;
    }

    const firstNodeOfType = nodesOfType[0];
    const onToggleTypeDisabled = firstNodeOfType
      ? firstNodeOfType.onToggleTypeDisabled
      : undefined;

    const allChecked = nodesOfType.every(node => !node.disabled_node);

    return (
      <NodeListGroup
        key={type.id}
        onToggleCollapsed={onToggleCollapsed}
        onToggleTypeDisabled={onToggleTypeDisabled}
        type={type}
        childCount={nodesOfType.length}
        allChecked={allChecked}
        collapsed={Boolean(searchValue) ? false : collapsed[type.id]}>
        <ul className="pipeline-nodelist pipeline-nodelist--nested">
          {nodesOfType.map(node => (
            <li key={node.id}>
              <NodeListRow
                active={nodeActive[node.id]}
                checked={!node.disabled_node}
                disabled={node.disabled_tag || node.disabled_type}
                id={node.id}
                label={node.highlightedLabel}
                name={node.name}
                selected={nodeSelected[node.id]}
                type={node.type}
                onClick={() => {
                  if (node.onClick) {
                    node.onClick(node);
                    return;
                  }

                  handleNodeSelection(node);
                }}
                onMouseEnter={() => {
                  if (node.onMouseEnter) {
                    node.onMouseEnter(node);
                    return;
                  }

                  onToggleNodeHovered(node.id);
                }}
                onMouseLeave={() => {
                  if (node.onMouseLeave) {
                    node.onMouseLeave(node);
                    return;
                  }

                  onToggleNodeHovered(null);
                }}
                onChange={e => {
                  if (node.onChange) {
                    node.onChange(node, !e.target.checked);
                    return;
                  }

                  onToggleNodesDisabled([node.id], !e.target.checked);
                }}
              />
            </li>
          ))}
        </ul>
      </NodeListGroup>
    );
  };

  return <ul className="pipeline-nodelist">{types.map(renderTypeGroup)}</ul>;
};

export const mapStateToProps = state => ({
  nodeActive: getNodeActive(state),
  nodeSelected: getNodeSelected(state),
  types: getNodeTypes(state)
});

export const mapDispatchToProps = dispatch => ({
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
