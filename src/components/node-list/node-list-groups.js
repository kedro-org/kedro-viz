import React, { useState } from 'react';
import { Flipper } from 'react-flip-toolkit';
import NodeListGroup from './node-list-group';
import NodeListItem from './node-list-item';

const NodeListGroups = ({ nodes, types }) => {
  const [collapsed, setCollapsed] = useState({});

  const onToggleCollapsed = typeID => {
    const newCollapsed = Object.assign({}, collapsed, {
      [typeID]: !collapsed[typeID]
    });
    setCollapsed(newCollapsed);
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
