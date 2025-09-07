import React from 'react';
import { toggleNodeClicked } from '../../../actions/nodes';
import WatchListDialog from '../watch-list-dialog';




function renderWatchModal(props){
  const [tempModalSelections, setTempModalSelections] = useState({});
  const [watchSearch, setWatchSearch] = useState('');

  const tempSelectedMap = Object.keys(tempModalSelections || {}).reduce(
    (acc, id) => {
      acc[id] = true;
      return acc;
    },
    {}
  );
  
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
  
  const { paramResults, datasetResults } = getSearchResults();

  return (
    <WatchListDialog
      isOpen={isWatchModalOpen}
      onClose={closeWatchModal}
      onConfirm={confirmAddSelected}
      onFlowchartNodeClick={(nodeId) =>
        onFlowchartNodeClickImpl({
          nodeId,
          paramNodes: props.paramNodes || [],
          datasets: props.datasets || [],
          dispatch: props.dispatch,
          toggleSelectToAdd,
        })
      }
      onFlowchartNodeDoubleClick={(node) =>
        onFlowchartNodeDoubleClickImpl({
          node,
          paramNodes: props.paramNodes || [],
          datasets: props.datasets || [],
          toggleSelectToAdd,
          setTempModalSelections: (updater) =>
            setTempModalSelections((prev) =>
              typeof updater === 'function' ? updater(prev) : updater
            ),
        })
      }
      tempSelectedMap={tempSelectedMap}
      stagedItems={tempModalSelections}
      watchSearch={watchSearch}
      onWatchSearchChange={setWatchSearch}
      paramResults={paramResults}
      datasetResults={datasetResults}
    />
  );
};

function WatchPanel({
  watchList,
  watchTab,
  strictlyChanged,
  getEditedParamValue,
  toYamlString,
}) {
  const [customOrder, setCustomOrder] = useState({
    param: false,
    dataset: false,
  });
  const [watchTab, setWatchTab] = useState('parameters');
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadataMode, setMetadataMode] = useState(null);
  const [selectedParamKey, setSelectedParamKey] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [draggingWatch, setDraggingWatch] = useState(null);

  const showToast = useCallback((message, duration = 2000) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToastMessage(String(message || ''));
    setToastVisible(true);
    toastTimer.current = setTimeout(() => {
      setToastVisible(false);
    }, Math.max(0, duration));
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    setToastVisible(false);
  }, []);


  const openWatchModal = useCallback(() => {
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
    setIsWatchModalOpen(true);
    setSelectedToAdd(selected);
    setTempModalSelections(tempSelections);
    setWatchSearch('');
  }, [watchList]);
  
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

  const toggleSelectToAdd = useCallback((kind, id) => {
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
  }, []);
  
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
      setWatchList((prev) => {
        const list = [...(prev || [])];
        const kind = targetKind;
        const kindItems = list.filter((item) => item.kind === kind);
        const fromIndex = kindItems.findIndex(
          (item) => item.id === draggingWatch.id
        );
        const toIndex = kindItems.findIndex((item) => item.id === targetId);
        if (fromIndex === -1 || toIndex === -1) {
          setDraggingWatch(null);
          return prev;
        }
        const reordered = [...kindItems];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        let i = 0;
        const nextList = list.map((item) =>
          item.kind === kind ? reordered[i++] : item
        );
        const nextCustom = { ...(customOrder || {}), [kind]: true };
        setCustomOrder(nextCustom);
        saveWatchToStorageDebounced(nextList, nextCustom);
        setDraggingWatch(null);
        return nextList;
      });
    },
    [draggingWatch, customOrder, saveWatchToStorageDebounced]
  );


  const onWatchItemClick = useCallback(
    (item) => {
      if (item.kind === 'param') {
        setSidInUrl(item.id);
        if (props.dispatch) {
          props.dispatch(loadNodeData(item.id));
          props.dispatch(toggleNodeClicked(item.id));
        }
        try {
          openParamEditor(item.id);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to open parameter editor for', item.id, e);
          showToast('Error opening parameter editor');
        }
      } else if (item.kind === 'dataset') {
        setSidInUrl(item.id);
        if (props.dispatch) {
          props.dispatch(loadNodeData(item.id));
          props.dispatch(toggleNodeClicked(item.id));
        }
        const dataset = (props.datasets || []).find(
          (datasetItem) => datasetItem.id === item.id
        );
        if (dataset) {
          openDatasetDetails(dataset);
        }
      }
    },
    [props, setSidInUrl, openParamEditor, showToast, openDatasetDetails]
  );

  const removeFromWatchList = useCallback(
    (kind, id) => {
      if (kind === 'param') {
        removeParamFromWatchList(id);
        return;
      }
      setWatchList((prev) =>
        (prev || []).filter((item) => !(item.kind === kind && item.id === id))
      );
      saveWatchToStorageDebounced();
    },
    [removeParamFromWatchList, saveWatchToStorageDebounced]
  );


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

export default WatchPanel;
