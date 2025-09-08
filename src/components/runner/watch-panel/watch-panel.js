import React, { useState, useRef, useCallback } from 'react';

const RUNNER_WATCH_CUSTOM_ORDER_STORAGE_KEY =
  'kedro_viz_runner_watch_custom_order';

function WatchPanel({
  watchList,
  strictlyChanged,
  getEditedParamValue,
  toYamlString,
  onWatchItemClick,
  removeFromWatchList,
}) {
  const [customOrder, setCustomOrder] = useState({
    param: false,
    dataset: false,
  });
  const [watchTab, setWatchTab] = useState('parameters');
  const [draggingWatch, setDraggingWatch] = useState(null);

  const saveCustomOrderToStorage = useCallback(() => {
    try {
      window.localStorage.setItem(
        RUNNER_WATCH_CUSTOM_ORDER_STORAGE_KEY,
        JSON.stringify(customOrder || {})
      );
    } catch {}
  }, [customOrder]);

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

  const startDragWatch = useCallback((kind, id) => {
    setDraggingWatch({ kind, id });
  }, []);

  const allowDropWatch = useCallback((e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
  }, []);

  const dropWatch = useCallback(
    (targetKind, targetId) => {
      if (
        !draggingWatch ||
        draggingWatch.kind !== targetKind ||
        draggingWatch.id === targetId
      ) {
        setDraggingWatch(null);
        return;
      }
      const kind = targetKind;
      const kindItems = watchList.filter((item) => item.kind === kind);
      const fromIndex = kindItems.findIndex(
        (item) => item.id === draggingWatch.id
      );
      const toIndex = kindItems.findIndex((item) => item.id === targetId);
      if (fromIndex === -1 || toIndex === -1) {
        setDraggingWatch(null);
      }
      const reordered = [...kindItems];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      let i = 0;
      const nextCustom = { ...(customOrder || {}), [kind]: true };
      setCustomOrder(nextCustom);
      setDraggingWatch(null);
      saveCustomOrderToStorage();
    },
    [draggingWatch, watchList, customOrder, saveCustomOrderToStorage]
  );

  // Aliases expected by JSX (the implementation names differ)
  const onDragStart = startDragWatch;
  const onDragOver = allowDropWatch;
  const onDrop = dropWatch;
  const onItemClick = onWatchItemClick;
  const onRemove = removeFromWatchList;

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
              key={`${item.name} (${item.kind}:${item.id})`}
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
                onClick={() => onRemove(item.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default WatchPanel;
