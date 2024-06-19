import React, { useState } from 'react';
import { loadLocalStorage, saveLocalStorage } from '../../store/helpers';
import NodeListGroup from './node-list-group';
import { localStorageName } from '../../config';
import Dropdown from '../ui/dropdown';
import MenuOption from '../ui/menu-option';
import Button from '../ui/button';
const storedState = loadLocalStorage(localStorageName);

const NodeListGroups = ({
  flags,
  groups,
  datasets,
  taskNodes,
  items,
  onGroupToggleChanged,
  onItemChange,
  onItemClick,
  onItemMouseEnter,
  onItemMouseLeave,
  searchValue,
  onFilterNodes,
  onResetNodesFilters,
}) => {
  const [collapsed, setCollapsed] = useState(storedState.groupsCollapsed || {});
  const [toNode, selectedToNode] = useState({});
  const [fromNode, selectedFromNode] = useState({});
  const isSlicingEnabled = flags.slicePipeline;

  // Collapse/expand node group
  const onToggleGroupCollapsed = (groupID) => {
    const groupsCollapsed = {
      ...collapsed,
      [groupID]: !collapsed[groupID],
    };

    setCollapsed(groupsCollapsed);
    saveLocalStorage(localStorageName, { groupsCollapsed });
  };

  return (
    <>
      {!isSlicingEnabled ? (
        <nav className="pipeline-nodelist-section kedro">
          <ul className="pipeline-nodelist__list">
            {Object.values(groups).map((group) => (
              <NodeListGroup
                allUnchecked={group.allUnchecked}
                checked={group.checked}
                collapsed={Boolean(searchValue) ? false : collapsed[group.id]}
                group={group}
                id={group.id}
                invisibleIcon={group.invisibleIcon}
                items={items[group.id] || []}
                key={group.id}
                kind={group.kind}
                name={group.name}
                onItemChange={onItemChange}
                onItemClick={onItemClick}
                onItemMouseEnter={onItemMouseEnter}
                onItemMouseLeave={onItemMouseLeave}
                onToggleChecked={onGroupToggleChanged}
                onToggleCollapsed={onToggleGroupCollapsed}
                visibleIcon={group.visibleIcon}
              />
            ))}
          </ul>
        </nav>
      ) : (
        <nav className="pipeline-nodelist-section kedro">
          <div className="pipeline-nodelist-section__form-wrapper">
            <div className="pipeline-nodelist-section__input-wrapper">
              <div className="pipeline-nodelist-section__input-label">
                From node
              </div>
              <Dropdown
                defaultText={fromNode.label}
                placeholderText={!fromNode.label ? 'Select a node' : null}
                onChanged={(selectedNode) => {
                  selectedFromNode(selectedNode);
                }}
                width={null}
              >
                {Object.entries(taskNodes).map(([value, label]) => (
                  <MenuOption key={value} primaryText={label} value={value} />
                ))}
              </Dropdown>
            </div>
            <div className="pipeline-nodelist-section__input-wrapper">
              <div className="pipeline-nodelist-section__input-label">
                To node
              </div>
              <Dropdown
                defaultText={toNode.label}
                placeholderText={!toNode.label ? 'Select a node' : null}
                onChanged={(selectedNode) => {
                  selectedToNode(selectedNode);
                }}
                width={null}
              >
                {Object.entries(taskNodes).map(([value, label]) => (
                  <MenuOption key={value} primaryText={label} value={value} />
                ))}
              </Dropdown>
              <div className="run-details-modal-button-wrapper">
                <Button
                  dataTest={'filter nodes'}
                  mode="secondary"
                  onClick={() => onFilterNodes(fromNode.value, toNode.value)}
                  size="small"
                >
                  Filter
                </Button>
                <Button
                  dataTest={'reset nodes filter'}
                  onClick={onResetNodesFilters}
                  size="small"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}
    </>
  );
};

export default NodeListGroups;
