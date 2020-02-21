import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Flipper } from 'react-flip-toolkit';
import { loadState, saveState } from '../../store/helpers';
import { getNodeTypes } from '../../selectors/node-types';
import NodeListGroup from './node-list-group';
import NodeListItem from './node-list-item';

const storedState = loadState();

const NodeListGroups = ({ nodes, types }) => {
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
        {nodes[type.id].map(node => (
          <NodeListItem key={node.id} node={node} />
        ))}
      </NodeListGroup>
    );
  };

  return (
    <Flipper flipKey={collapsed}>
      <ul className="pipeline-node-list">{types.map(renderTypeGroup)}</ul>
    </Flipper>
  );
};

export const mapStateToProps = state => ({
  types: getNodeTypes(state)
});

export default connect(mapStateToProps)(NodeListGroups);
