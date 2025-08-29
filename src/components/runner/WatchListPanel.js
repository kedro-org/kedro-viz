import React from 'react';

/**
 * WatchListPanel - Presentational component for displaying the watch list (parameters and datasets).
 * Props:
 *   watchList: Array of watch list items
 *   onWatchItemClick: Function(item)
 *   onRemoveFromWatchList: Function(kind, id)
 *   strictlyChanged: Object mapping param keys to changed state
 *   ...other props as needed
 */
function WatchListPanel({
  watchList = [],
  onWatchItemClick,
  onRemoveFromWatchList,
  strictlyChanged = {},
}) {
  if (!watchList.length) {
    return (
      <div className="watch-list-panel__empty">No items in watch list.</div>
    );
  }
  return (
    <div className="watch-list-panel__body">
      {watchList.map((item) => (
        <div key={item.kind + ':' + item.id} className="watch-list-panel__item">
          <span
            className="watch-list-panel__name"
            onClick={() => onWatchItemClick(item)}
          >
            {item.name || item.id}
          </span>
          {item.kind === 'param' && strictlyChanged[item.id] && (
            <span className="watch-list-panel__changed">*</span>
          )}
          <button
            className="watch-list-panel__remove"
            onClick={() => onRemoveFromWatchList(item.kind, item.id)}
            title="Remove from watch list"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

export default WatchListPanel;
