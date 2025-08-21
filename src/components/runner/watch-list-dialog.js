import React from 'react';
import FlowChart from '../flowchart';

// Presentational dialog for selecting parameters/datasets for the watch list
export default function WatchListDialog({
  isOpen,
  onClose,
  onConfirm,
  onFlowchartNodeClick,
  onFlowchartNodeDoubleClick,
  tempSelectedMap = {}, // id -> true
  stagedItems = {}, // id -> { kind, id, name }
  watchSearch = '',
  onWatchSearchChange,
  paramResults = [], // [{kind:'param', id, name}]
  datasetResults = [], // [{kind:'dataset', id, name}]
  canConfirm,
}) {
  if (!isOpen) {
    return null;
  }
  // Allow confirm even when staged is empty (enables clearing all selections)
  const allowConfirm = typeof canConfirm === 'boolean' ? canConfirm : true;

  // Pending counts for footer caption
  const stagedValues = Object.values(stagedItems || {});
  const paramCount = stagedValues.filter(
    (stagedItem) => stagedItem.kind === 'param'
  ).length;
  const datasetCount = stagedValues.filter(
    (stagedItem) => stagedItem.kind === 'dataset'
  ).length;

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
                onToggleNodeClicked={onFlowchartNodeClick}
                onLoadNodeData={() => {}}
                onNodeDoubleClick={onFlowchartNodeDoubleClick}
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
                onChange={(e) =>
                  onWatchSearchChange && onWatchSearchChange(e.target.value)
                }
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
                          (stagedItems || {})[item.id]
                            ? 'watchmodal__result-item--selected'
                            : ''
                        }`}
                        onClick={() =>
                          onFlowchartNodeDoubleClick &&
                          onFlowchartNodeDoubleClick({
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
                          (stagedItems || {})[item.id]
                            ? 'watchmodal__result-item--selected'
                            : ''
                        }`}
                        onClick={() =>
                          onFlowchartNodeDoubleClick &&
                          onFlowchartNodeDoubleClick({
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
              onClick={onConfirm}
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
