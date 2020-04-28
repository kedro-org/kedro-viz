import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Flipper } from 'react-flip-toolkit';
import { loadState, saveState } from '../../store/helpers';
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
  types
}) => {
  const [collapsed, setCollapsed] = useState(storedState.groupsCollapsed || {});

  const onToggleCollapsed = typeID => {
    const groupsCollapsed = Object.assign({}, collapsed, {
      [typeID]: !collapsed[typeID]
    });
    setCollapsed(groupsCollapsed);
    saveState({ groupsCollapsed });
  };

  const renderTypeGroup = type => {
    if (!nodes[type.id]) {
      return null;
    }
    return (
      <NodeListGroup
        key={type.id}
        onToggleCollapsed={onToggleCollapsed}
        type={type}
        collapsed={collapsed[type.id]}>
        <ul className="pipeline-nodelist pipeline-nodelist--nested">
          {nodes[type.id].map(node => (
            <li key={node.id}>
              <NodeListRow
                active={node.active}
                checked={!node.disabled_node}
                disabled={node.disabled_tag || node.disabled_type}
                id={node.id}
                label={node.highlightedLabel}
                name={node.name}
                onClick={() => onToggleNodeClicked(node.id)}
                onMouseEnter={() => onToggleNodeHovered(node.id)}
                onMouseLeave={() => onToggleNodeHovered(null)}
                onChange={e => {
                  onToggleNodesDisabled([node.id], !e.target.checked);
                }}
                type={node.type}
              />
            </li>
          ))}
        </ul>
      </NodeListGroup>
    );
  };

  return (
    <Flipper flipKey={collapsed}>
      <ul className="pipeline-nodelist">{types.map(renderTypeGroup)}</ul>
    </Flipper>
  );
};

export const mapStateToProps = state => ({
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
