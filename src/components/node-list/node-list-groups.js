import React, { useState } from 'react';
import { loadLocalStorage, saveLocalStorage } from '../../store/helpers';
import NodeListGroup from './node-list-group';
import { localStorageName } from '../../config';
import Dropdown from '../ui/dropdown';
import MenuOption from '../ui/menu-option';
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
  toNodes,
  fromNodes,
  selectedFromNodes,
  selectedToNodes,
}) => {
  const [collapsed, setCollapsed] = useState(storedState.groupsCollapsed || {});
  const [toNodeName, selectedToNodeName] = useState('');
  const [fromNodeName, selectedFromNodeName] = useState('');
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
                defaultText= {fromNodeName}
                placeholderText={!fromNodeName? 'Select a node' : null}
                onChanged={selectedNode => {
                  selectedFromNodes(selectedNode.value);
                  selectedFromNodeName(selectedNode.label);
                }
                }
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
                defaultText= {toNodeName}
                placeholderText={!toNodeName ? 'Select a node' : null}
                onChanged={selectedNode => {
                  selectedToNodes(selectedNode.value);
                  selectedToNodeName(selectedNode.label);
                }
                }
                width={null}
              >
                {Object.entries(taskNodes).map(([value, label]) => (
                  <MenuOption key={value} primaryText={label} value={value} />
                ))}
              </Dropdown>
            </div>
            

            </div>
        </nav>
      )}
    </>
  );
};

export default NodeListGroups;
