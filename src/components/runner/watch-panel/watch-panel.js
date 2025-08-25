import React from 'react';
import { toggleNodeClicked } from '../../../actions/nodes';

const WatchPanel = ({
  watchList,
  watchTab,
  customOrder,
  strictlyChanged,
  setWatchTab,
  onDragStart,
  onDragOver,
  onDrop,
  onItemClick,
  onRemove,
  getEditedParamValue,
  toYamlString,
}) => {
  const parameterItems = (watchList || []).filter(
    (watchItem) => watchItem.kind === 'param'
  );
  const datasetItems = (watchList || []).filter(
    (watchItem) => watchItem.kind === 'dataset'
  );
  let itemsToShow = watchTab === 'parameters' ? parameterItems : datasetItems;
  const kindKey = watchTab === 'parameters' ? 'param' : 'dataset';
  if (!customOrder?.[kindKey]) {
    itemsToShow = [...itemsToShow].sort((a, b) =>
      (a.name || a.id).localeCompare(b.name || b.id, undefined, {
        sensitivity: 'base',
      })
    );
  }

  const getParamPreview = (key) => {
    const value = getEditedParamValue(key);
    if (typeof value === 'undefined') {
      return '—';
    }
    const text = toYamlString(value) || '';
    const firstLine = String(text).split(/\r?\n/)[0];
    return firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine;
  };

  return (
    <div className="runner-panel runner-panel--watchlist">
      <div className="runner-panel__toolbar">
        <div className="runner-panel__tabs">
          <button
            className={`runner-tab ${
              watchTab === 'parameters' ? 'runner-tab--active' : ''
            }`}
            onClick={() => setWatchTab('parameters')}
          >
            Parameters ({parameterItems.length})
          </button>
          <button
            className={`runner-tab ${
              watchTab === 'datasets' ? 'runner-tab--active' : ''
            }`}
            onClick={() => setWatchTab('datasets')}
          >
            Datasets ({datasetItems.length})
          </button>
        </div>
      </div>
      <div className="runner-panel__list" role="region" aria-label="Watch list">
        {!watchList?.length && (
          <div className="watchlist-empty">No items in your watch list.</div>
        )}
        <ul className="watchlist-list">
          {itemsToShow.map((item) => (
            <li
              key={`${item.kind}:${item.id}`}
              className={`watchlist-item ${
                item.kind === 'param' && strictlyChanged?.[item.id]
                  ? 'watchlist-item--edited'
                  : ''
              }`}
              draggable
              onDragStart={() => onDragStart(item.kind, item.id)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(item.kind, item.id)}
            >
              <button
                className="watchlist-item__main"
                onClick={() => onItemClick(item)}
              >
                <span className="watchlist-item__name">{item.name}</span>
                {watchTab === 'parameters' && (
                  <span className="watchlist-item__preview">
                    {getParamPreview(item.id)}
                  </span>
                )}
              </button>
              <button
                className="watchlist-item__remove"
                aria-label="Remove from watch list"
                onClick={() => onRemove(item.kind, item.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WatchPanel;

// Helper: handle single-click on a flowchart node within the watch modal
// Moves selection logic here so Runner manager can delegate.
export function onFlowchartNodeClickImpl({
  nodeId,
  paramNodes = [],
  datasets = [],
  dispatch,
  toggleSelectToAdd,
}) {
  if (!nodeId) {
    return;
  }
  const isParam = (paramNodes || []).some(
    (paramNode) => paramNode.id === nodeId
  );
  const datasetItem = (datasets || []).find((d) => d.id === nodeId);
  if (isParam) {
    toggleSelectToAdd && toggleSelectToAdd('param', nodeId);
  } else if (datasetItem) {
    toggleSelectToAdd && toggleSelectToAdd('dataset', datasetItem.id);
  }
  if (dispatch) {
    try {
      dispatch(toggleNodeClicked(nodeId));
    } catch (e) {
      // ignore
    }
  }
}

// Helper: handle double-click on a flowchart/search result item to stage selection
export function onFlowchartNodeDoubleClickImpl({
  node,
  paramNodes = [],
  datasets = [],
  toggleSelectToAdd,
  setTempModalSelections, // function: (updater) => void
}) {
  const nodeId = node && node.id;
  if (!nodeId) {
    return;
  }
  const isParam = (paramNodes || []).some(
    (paramNode) => paramNode.id === nodeId
  );
  let entry;
  if (isParam) {
    entry = { kind: 'param', id: nodeId, name: node.name || nodeId };
    toggleSelectToAdd && toggleSelectToAdd('param', nodeId);
  } else {
    const datasetItem = (datasets || []).find((d) => d.id === nodeId);
    if (!datasetItem) {
      return;
    }
    entry = {
      kind: 'dataset',
      id: datasetItem.id,
      name: datasetItem.name || datasetItem.id,
    };
    toggleSelectToAdd && toggleSelectToAdd('dataset', datasetItem.id);
  }
  if (typeof setTempModalSelections === 'function') {
    setTempModalSelections((prevMap = {}) => {
      const next = { ...prevMap };
      if (next[nodeId]) {
        delete next[nodeId];
      } else {
        next[nodeId] = entry;
      }
      return next;
    });
  }
}
