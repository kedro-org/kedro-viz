import React from 'react';
import TreeItem from '@material-ui/lab/TreeItem';
import NodeListRow from './node-list-row';

const NodeListTreeItem = ({
  data,
  onItemClick,
  onItemMouseEnter,
  onItemMouseLeave,
  onItemChange,
  children,
  searchCount,
}) => (
  <TreeItem
    key={data.id}
    nodeId={data.id}
    label={
      <NodeListRow
        container="div"
        key={data.id}
        id={data.id}
        kind="element"
        label={data.highlightedLabel || data.name}
        name={data.name}
        icon={data.icon}
        type={data.type}
        active={data.active}
        checked={data.checked}
        disabled={data.disabled}
        faded={data.faded}
        visible={data.visible}
        selected={data.selected}
        unset={data.unset}
        allUnset={true}
        visibleIcon={data.visibleIcon}
        invisibleIcon={data.invisibleIcon}
        onClick={() => onItemClick(data)}
        onMouseEnter={() => onItemMouseEnter(data)}
        onMouseLeave={() => onItemMouseLeave(data)}
        onChange={(e) => onItemChange(data, !e.target.checked)}
        rowType="tree"
        searchCount={searchCount}
      />
    }>
    {children}
  </TreeItem>
);

export default NodeListTreeItem;
