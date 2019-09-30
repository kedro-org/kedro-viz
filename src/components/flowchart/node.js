import React from 'react';
import classnames from 'classnames';
import { ReactComponent as DataIcon } from './icon-data.svg';
import { ReactComponent as TaskIcon } from './icon-task.svg';

const icons = {
  data: DataIcon,
  task: TaskIcon
};

const iconSizes = {
  data: 17,
  task: 18
};

export default ({
  node,
  textLabels,
  centralNode,
  linkedNodes,
  handleNodeClick,
  handleNodeMouseOver,
  handleNodeMouseOut,
  handleNodeKeyDown
}) => {
  const Icon = icons[node.type];
  return (
    <g
      tabIndex="0"
      transform={`translate(${node.x || 0}, ${node.y || 0})`}
      // opacity={0}
      className={classnames('node', {
        'node--data': node.type === 'data',
        'node--task': node.type === 'task',
        'node--icon': !textLabels,
        'node--text': textLabels,
        'node--active': node.active,
        'node--highlight': centralNode && linkedNodes[node.id],
        'node--faded': centralNode && !linkedNodes[node.id]
      })}
      onClick={e => handleNodeClick(e, node)}
      onMouseOver={e => handleNodeMouseOver(e, node)}
      onMouseOut={handleNodeMouseOut}
      onFocus={e => handleNodeMouseOver(e, node)}
      onBlur={handleNodeMouseOut}
      onKeyDown={e => handleNodeKeyDown(e, node)}>
      <rect
        width={node.width - 5}
        height={node.height - 5}
        x={(node.width - 5) / -2}
        y={(node.height - 5) / -2}
        rx={node.type === 'data' ? node.height / 2 : 0}
      />
      <text data-id={node.id} textAnchor="middle" dy="4">
        {node.name}
      </text>
      <Icon
        className="node__icon"
        width={iconSizes[node.type]}
        height={iconSizes[node.type]}
        x={iconSizes[node.type] / -2}
        y={iconSizes[node.type] / -2}
      />
    </g>
  );
};
