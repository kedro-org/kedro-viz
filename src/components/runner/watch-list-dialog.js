import React, { useState, useCallback, useEffect } from 'react';
import FlowChart from '../flowchart';
import { use } from 'react';
import { toggleNodeClicked, loadNodeData } from '../../actions/nodes';

// Helper: processing node selection
function onSelectNodeClickImpl({
  node,
  paramNodes = [],
  datasets = [],
  toggleSelectToAdd,
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
}

// Presentational dialog for selecting parameters/datasets for the watch list
function WatchListDialog({ watchList, props, onClose, onConfirm }) {
  const [watchSearch, setWatchSearch] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState({}); // { 'kind:id': true }
  const [tempModalSelections, setTempModalSelections] = useState({}); // { id: {kind, id, name} }
  const [tempSelectedMap, setTempSelectedMap] = useState({}); // { id: true }
  const [allowConfirm, setAllowConfirm] = useState(false);
  const [paramCount, setParamCount] = useState(0);
  const [datasetCount, setDatasetCount] = useState(0);
  const [paramResults, setParamResults] = useState([]);
  const [datasetResults, setDatasetResults] = useState([]);

  useEffect(() => {
    const originalKeys = Object.keys(watchList || {});
    const currentKeys = Object.keys(tempModalSelections || {});

    if (
      originalKeys.length === currentKeys.length &&
      originalKeys.every((key) => currentKeys.includes(key))
    ) {
      setAllowConfirm(false);
    } else {
      setAllowConfirm(true);
    }
  }, [watchList, tempModalSelections]);

  useEffect(() => {
    const selected = {};
    const tempSelections = {};
    (watchList || []).forEach((item) => {
      selected[`${item.kind}:${item.id}`] = true;
      tempSelections[item.id] = {
        kind: item.kind,
        id: item.id,
        name: item.name || item.id,
      };
    });
    setSelectedToAdd(selected);
    setTempModalSelections(tempSelections);
  }, [watchList]);

  const toggleSelectToAdd = useCallback((kind, id, name) => {
    const key = `${kind}:${id}`;
    setSelectedToAdd((prev) => {
      const next = { ...(prev || {}) };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
    setTempModalSelections((prev) => {
      const next = { ...(prev || {}) };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = { kind, id, name: name || id };
      }
      return next;
    });
  }, []);

  // Pending counts for footer caption
  useEffect(() => {
    const stagedValues = Object.values(tempModalSelections || {});
    const paramCount = stagedValues.filter(
      (item) => item.kind === 'param'
    ).length;
    setParamCount(paramCount);

    const datasetCount = stagedValues.filter(
      (item) => item.kind === 'dataset'
    ).length;
    setDatasetCount(datasetCount);
  }, [tempModalSelections]);

  const getSearchResults = useCallback(() => {
    const query = (watchSearch || '').trim().toLowerCase();
    const makeMatch = (text) =>
      text && String(text).toLowerCase().includes(query);

    const paramResults = (props.paramNodes || [])
      .map((node) => ({
        kind: 'param',
        id: node.id,
        name: node.name || node.id,
      }))
      .filter((item) => !query || makeMatch(item.id) || makeMatch(item.name))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );

    const datasetResults = (props.datasets || [])
      .map((dataset) => ({
        kind: 'dataset',
        id: dataset.id,
        name: dataset.name || dataset.id,
      }))
      .filter((item) => !query || makeMatch(item.id) || makeMatch(item.name))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );

    return { paramResults, datasetResults };
  }, [watchSearch, props]);

  useEffect(() => {
    const { paramResults, datasetResults } = getSearchResults();
    setParamResults(paramResults);
    setDatasetResults(datasetResults);
  }, [getSearchResults]);

  useEffect(() => {
    const newTempSelectedMap = Object.keys(tempModalSelections || {}).reduce(
      (acc, id) => {
        acc[id] = true;
        return acc;
      },
      {}
    );
    setTempSelectedMap(newTempSelectedMap);
  }, [tempModalSelections]);

  const onSelectNodeClick = useCallback(
    (node) => {
      onSelectNodeClickImpl({
        node,
        paramNodes: props.paramNodes,
        datasets: props.datasets,
        toggleSelectToAdd,
      });
    },
    [props]
  );

  return (
    <div className="watchmodal" role="dialog" aria-label="Add to watch list">
      <div className="watchmodal__backdrop" onClick={onClose} />
      <div className="watchmodal__content">
        <div className="watchmodal__header">
          <h3>Select items to watch</h3>
          <button
            className="watchmodal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="watchmodal__body">
          <div className="watchmodal__flowcol">
            <div className="watchmodal__flowchart">
              <FlowChart
                displayMetadataPanel={false}
                onToggleNodeClicked={onSelectNodeClick}
                onLoadNodeData={() => {}}
                onNodeDoubleClick={onSelectNodeClick}
                tempSelectedMap={tempSelectedMap}
              />
            </div>
            <div className="watchmodal__flow-hint" aria-live="polite">
              Tip: Double-click a node to select it.
            </div>
          </div>
          <aside className="watchmodal__selector">
            <div className="watchmodal__search">
              <input
                className="watchmodal__search-input"
                type="text"
                placeholder="Search parameters and datasets..."
                value={watchSearch}
                onChange={(e) => setWatchSearch(e.target.value)}
              />
            </div>
            <div className="watchmodal__results">
              <div
                className="watchmodal__results-col"
                aria-label="Parameters column"
              >
                <h5 className="watchmodal__results-title">Parameters</h5>
                <ul className="watchmodal__results-list">
                  {paramResults.length ? (
                    paramResults.map((item) => (
                      <li
                        key={`result-${item.kind}:${item.id}`}
                        className={`watchmodal__result-item ${
                          (tempModalSelections || {})[item.id]
                            ? 'watchmodal__result-item--selected'
                            : ''
                        }`}
                        onClick={() =>
                          onSelectNodeClick({
                            id: item.id,
                            name: item.name,
                          })
                        }
                        role="button"
                        tabIndex={0}
                      >
                        <span className="watchmodal__name">{item.name}</span>
                      </li>
                    ))
                  ) : (
                    <li className="watchmodal__results-empty">No parameters</li>
                  )}
                </ul>
              </div>
              <div
                className="watchmodal__results-col"
                aria-label="Datasets column"
              >
                <h5 className="watchmodal__results-title">Datasets</h5>
                <ul className="watchmodal__results-list">
                  {datasetResults.length ? (
                    datasetResults.map((item) => (
                      <li
                        key={`result-${item.kind}:${item.id}`}
                        className={`watchmodal__result-item ${
                          (tempModalSelections || {})[item.id]
                            ? 'watchmodal__result-item--selected'
                            : ''
                        }`}
                        onClick={() =>
                          onSelectNodeClick({
                            id: item.id,
                            name: item.name,
                          })
                        }
                        role="button"
                        tabIndex={0}
                      >
                        <span className="watchmodal__name">{item.name}</span>
                      </li>
                    ))
                  ) : (
                    <li className="watchmodal__results-empty">No datasets</li>
                  )}
                </ul>
              </div>
            </div>
          </aside>
        </div>
        <div className="watchmodal__footer">
          <div className="watchmodal__pending-caption" aria-live="polite">
            Pending additions: {paramCount} parameter
            {paramCount === 1 ? '' : 's'}, {datasetCount} dataset
            {datasetCount === 1 ? '' : 's'}
          </div>
          <div className="watchmodal__footer-actions">
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn--primary"
              onClick={({}) =>
                onConfirm(Object.values(tempModalSelections || {}))
              }
              disabled={!allowConfirm}
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WatchListDialog;
