import React, { useState, useCallback, useEffect } from 'react';
import './watch-panel.css';
import { toYamlString } from '../utils/yamlUtils';

const RUNNER_WATCH_CUSTOM_ORDER_STORAGE_KEY =
  'kedro_viz_runner_watch_custom_order';

function WatchPanel({
  watchList = [],
  strictlyChanged = {},
  getEditedParamValue = () => {},
  onClickItem = () => {},
  onRemoveItem = () => {},
  onClear = () => {},
  onAdd = () => {},
} = {}) {
  const [customOrder, setCustomOrder] = useState({
    param: false,
    dataset: false,
  });
  const [watchTab, setWatchTab] = useState('param');
  const [draggingWatch, setDraggingWatch] = useState(null);
  const [itemsToShow, setItemsToShow] = useState([]);

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

  useEffect(() => {
    let newItemsToShow = watchTab === 'param' ? parameterItems : datasetItems;

    if (!customOrder?.[watchTab]) {
      newItemsToShow = [...newItemsToShow].sort((a, b) =>
        (a.name || a.id).localeCompare(b.name || b.id, undefined, {
          sensitivity: 'base',
        })
      );
    }
    setItemsToShow(newItemsToShow);
  }, [watchTab, parameterItems, datasetItems, customOrder, setItemsToShow]);

  const getParamPreview = useCallback(
    (key) => {
      const value = getEditedParamValue(key);
      if (typeof value === 'undefined') {
        return '—';
      }
      const text = toYamlString(value) || '';
      const firstLine = String(text).split(/\r?\n/)[0];
      return firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine;
    },
    [getEditedParamValue]
  );

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
      const nextCustom = { ...(customOrder || {}), [kind]: true };
      setCustomOrder(nextCustom);
      setDraggingWatch(null);
    },
    [draggingWatch, watchList, customOrder]
  );

  useEffect(() => {
    saveCustomOrderToStorage();
  }, [customOrder]);

  if (process.env.NODE_ENV !== 'production' && !Array.isArray(watchList)) {
    // eslint-disable-next-line no-console
    console.warn('[WatchPanel] Invalid watchList value', watchList);
    return null;
  }

  return (
    <>
      <div className="editor__header">
        <h3 className="section-title">Watch list</h3>
        <div className="editor__actions">
          <button className="btn btn--secondary" onClick={onAdd}>
            Add
          </button>
          <button
            className="btn btn--secondary"
            onClick={onClear}
            disabled={!(watchList || []).length}
          >
            Clear
          </button>
        </div>
      </div>
      <div className="runner-panel runner-panel--watchlist">
        <div className="runner-panel__toolbar">
          <div className="runner-panel__tabs">
            <button
              className={`runner-tab ${
                watchTab === 'param' ? 'runner-tab--active' : ''
              }`}
              onClick={() => setWatchTab('param')}
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
        <div
          className="runner-panel__list"
          role="region"
          aria-label="Watch list"
        >
          {!watchList?.length && (
            <div className="watchlist-empty">No items in your watch list.</div>
          )}
          <ul className="watchlist-list">
            {itemsToShow.map((item) => (
              <li
                key={`${item.name}`}
                className={`watchlist-item ${
                  item.kind === 'param' && strictlyChanged?.[item.id]
                    ? 'watchlist-item--edited'
                    : ''
                }`}
                draggable
                onDragStart={() => startDragWatch(item.kind, item.id)}
                onDragOver={allowDropWatch}
                onDrop={() => dropWatch(item.kind, item.id)}
              >
                <button
                  className="watchlist-item__main"
                  onClick={() => onClickItem(item)}
                >
                  <span className="watchlist-item__name">{`${item.name}`}</span>
                  {watchTab === 'param' && (
                    <span className="watchlist-item__preview">
                      {getParamPreview(item.id)}
                    </span>
                  )}
                </button>
                <button
                  className="watchlist-item__remove"
                  aria-label="Remove from watch list"
                  onClick={() => onRemoveItem(item.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default WatchPanel;
