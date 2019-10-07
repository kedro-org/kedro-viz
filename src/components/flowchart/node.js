import React, { useEffect, useState, useRef } from 'react';
import classnames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import 'd3-transition';
import { select } from 'd3-selection';
import { ReactComponent as DataIcon } from './icon-data.svg';
import { ReactComponent as TaskIcon } from './icon-task.svg';
import { DURATION } from './index';

const icons = {
  data: DataIcon,
  task: TaskIcon
};

const iconSizes = {
  data: 17,
  task: 18
};

export default ({
  in: show,
  node,
  textLabels,
  highlighted,
  faded,
  handleNodeClick,
  handleNodeMouseOver,
  handleNodeMouseOut,
  handleNodeKeyDown
}) => {
  const Icon = icons[node.type];
  const gRef = useRef(null);
  const [prevNode, setState] = useState(node);

  useEffect(() => {
    if (isNaN(node.x) || isNaN(node.y)) {
      return;
    }
    if (isNaN(prevNode.x) && !isNaN(node.x)) {
      setState(node);
      return;
    }
    select(gRef.current)
      .transition('update-node-translate')
      .duration(DURATION)
      .attr('transform', `translate(${node.x}, ${node.y})`)
      .on('end', () => {
        if (show) {
          setState(node);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.x, node.y]);

  return (
    <CSSTransition
      classNames="node"
      timeout={DURATION}
      mountOnEnter
      unmountOnExit
      appear
      in={show}>
      <g
        ref={gRef}
        tabIndex="0"
        transform={`translate(${prevNode.x || 0}, ${prevNode.y || 0})`}
        className={classnames('node', {
          'node--data': node.type === 'data',
          'node--task': node.type === 'task',
          'node--icon': !textLabels,
          'node--text': textLabels,
          'node--active': node.active,
          'node--highlight': highlighted,
          'node--faded': faded
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
    </CSSTransition>
  );
};
