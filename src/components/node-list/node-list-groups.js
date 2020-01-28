import React, { useState } from 'react';
import { Flipper } from 'react-flip-toolkit';
import { loadState, saveState } from '../../utils';
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

  const renderTypeGroup = type => (
    <NodeListGroup
      key={type.id}
      onToggleCollapsed={onToggleCollapsed}
      type={type}
      collapsed={collapsed}>
      {nodes[type.id].map(node => (
        <NodeListItem
          key={node.id}
          node={node}
          disabled={node.disabled_tag || node.disabled_view || type.disabled}
        />
      ))}
    </NodeListGroup>
  );

  return (
    <Flipper flipKey={collapsed}>
      <ul className="pipeline-node-list">
        {types.map(type => nodes[type.id] && renderTypeGroup(type))}
      </ul>
    </Flipper>
  );
};

export default NodeListGroups;
