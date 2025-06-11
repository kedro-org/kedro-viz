import React from 'react';
import classnames from 'classnames';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TreeItem } from '@mui/x-tree-view';
import NodeListRow from '../node-list-row/node-list-row';
import { getDataTestAttribute } from '../../../utils/get-data-test-attribute';

const arrowIconColor = '#8e8e90';

const NodeListTreeItem = ({
  data,
  onItemClick,
  onItemMouseEnter,
  onItemMouseLeave,
  onItemChange,
  onToggleHoveredFocusMode,
  children,
  isSlicingPipelineApplied,
}) => (
  <TreeItem
    className={classnames('pipeline-treeItem__root--overwrite', {
      'pipeline-treeItem__root--overwrite--focused': data.focused,
      'pipeline-treeItem__root--overwrite--disabled': data.disabled,
    })}
    key={data.id}
    nodeId={data.id}
    // this setup is to allow flexibility for adjusting the setting for individual arrow icons
    collapseIcon={<ExpandMoreIcon style={{ color: arrowIconColor }} />}
    expandIcon={<ChevronRightIcon style={{ color: arrowIconColor }} />}
    label={
      <NodeListRow
        active={data.active}
        checked={data.checked}
        dataTest={getDataTestAttribute('node-list-tree-item', 'row')}
        disabled={data.disabled}
        faded={data.faded}
        focused={data.focused}
        focusModeIcon={data.focusModeIcon}
        highlight={data.highlight}
        icon={data.icon}
        id={data.id}
        invisibleIcon={data.invisibleIcon}
        isSlicingPipelineApplied={isSlicingPipelineApplied}
        key={data.id}
        kind="element"
        label={data.highlightedLabel || data.name}
        name={data.name}
        onChange={(e) =>
          onItemChange(data, !e.target.checked, e.target.dataset.iconType)
        }
        onClick={(e) => onItemClick(e, data)}
        onMouseEnter={() => onItemMouseEnter(data)}
        onMouseLeave={() => onItemMouseLeave(data)}
        onToggleHoveredFocusMode={onToggleHoveredFocusMode}
        parentClassName={'node-list-tree-item-row'}
        rowType="tree"
        selected={data.selected}
        type={data.type}
        visible={data.visible}
        visibleIcon={data.visibleIcon}
      />
    }
  >
    {children}
  </TreeItem>
);

export default NodeListTreeItem;
