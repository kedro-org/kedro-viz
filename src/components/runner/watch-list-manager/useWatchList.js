import { useRef, useState, useCallback, useEffect } from 'react';
import useParameterEditor from './useParameterEditor';
import { addNodeMetadata, toggleNodeDataLoading } from '../../../actions/nodes';
import loadJsonData from '../../../store/load-data';
import { getUrl } from '../../../utils';

function fetchNodeMetadataIfNeeded(nodeID) {
  return async function (dispatch, getState) {
    if (!nodeID) {
      return;
    }
    const { dataSource, node } = getState();
    if (dataSource !== 'json' || node.fetched[nodeID]) {
      return;
    }
    dispatch(toggleNodeDataLoading(true));
    try {
      const url = getUrl('nodes', nodeID);
      const data = await loadJsonData(url);
      dispatch(addNodeMetadata({ id: nodeID, data }));
    } finally {
      dispatch(toggleNodeDataLoading(false));
    }
  };
}

// Keys for persisting Watch list and custom order
const RUNNER_WATCHLIST_STORAGE_KEY = 'kedro_viz_runner_watch_list';

/**
 * useWatchList: Manages a watch list of nodes and parameters, integrating with a parameter editor.
 */
function useWatchList(props) {
  const { dispatch } = props || {};
  const saveWatchTimer = useRef();
  const [watchList, setWatchList] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const {
    paramOriginals,
    paramEdits,
    strictlyChanged,
    addParams: addParamsInEditor,
    removeParam: removeParamInEditor,
    clearParams: clearParamsInEditor,
    resetParam: resetParamInEditor,
    editParam: editParamInEditor,
    loadParamsFromStorage,
  } = useParameterEditor();

  const ensureItemMetadata = useCallback(
    (itemId) => {
      const cached =
        props.clickedNodeMetaData?.id === itemId
          ? props.clickedNodeMetaData
          : props.nodeParameters?.[itemId];

      if (dispatch && !cached) {
        dispatch(fetchNodeMetadataIfNeeded(itemId));
      }
    },
    [props, dispatch]
  );

  const getBaseParamValue = useCallback(
    (paramKey) => {
      // First check if there's metadata available from the clicked node
      try {
        const meta = props?.clickedNodeMetaData;
        if (
          meta?.parameters &&
          Object.prototype.hasOwnProperty.call(meta.parameters, paramKey)
        ) {
          const metaVal = meta.parameters[paramKey];
          if (typeof metaVal !== 'undefined') {
            return metaVal;
          }
        }
      } catch {}

      // Fallback to the redux store
      const reduxMap = props?.nodeParameters || {};
      if (Object.prototype.hasOwnProperty.call(reduxMap, paramKey)) {
        const val = reduxMap[paramKey];

        if (val && typeof val === 'object' && !Array.isArray(val)) {
          if (Object.prototype.hasOwnProperty.call(val, paramKey)) {
            return val[paramKey];
          }
          const keys = Object.keys(val);
          if (keys.length === 1) {
            return val[keys[0]];
          }
        }
      }
      return undefined;
    },
    [props]
  );

  const setParamValueForKey = useCallback(
    (paramKey, newValue) => {
      editParamInEditor(paramKey, newValue);
    },
    [editParamInEditor]
  );

  const getParamValueFromKey = useCallback(
    (paramKey) => {
      if (Object.prototype.hasOwnProperty.call(paramEdits, paramKey)) {
        const val = paramEdits[paramKey];
        if (typeof val !== 'undefined') {
          return val;
        }
        return undefined;
      }
      // Seed editor with base value if not present
      const val = getBaseParamValue(paramKey);
      setParamValueForKey(paramKey, val);
      return val;
    },
    [paramEdits, getBaseParamValue, setParamValueForKey]
  );

  const addToWatchList = useCallback(
    (item) => {
      if (!item || !item.kind || !item.id) {
        return;
      }
      ensureItemMetadata(item.id);

      setWatchList((prev) => {
        const exists = prev.some(
          (wlItem) => wlItem.kind === item.kind && wlItem.id === item.id
        );
        if (exists) {
          return prev;
        }

        return [...prev, item];
      });
    },
    [setWatchList]
  );

  const removeFromWatchList = useCallback(
    (itemId) => {
      if (!itemId) {
        return;
      }

      setWatchList((prev) => prev.filter((wlItem) => !(wlItem.id === itemId)));
    },
    [setWatchList]
  );

  const updateWatchList = useCallback(
    (newWatchList) => {
      if (!Array.isArray(newWatchList)) {
        return;
      }

      const currentIds = (newWatchList || []).map((item) => item.id);
      currentIds.forEach((itemId) => {
        ensureItemMetadata(itemId);
      });

      setWatchList(newWatchList);
    },
    [setWatchList, dispatch]
  );

  const clearWatchList = useCallback(() => {
    setWatchList([]);
    clearParamsInEditor();
  }, [setWatchList, clearParamsInEditor]);

  // --- Watch list persistence/helpers ---
  const saveWatchToStorage = useCallback(
    (list = watchList) => {
      try {
        window.localStorage.setItem(
          RUNNER_WATCHLIST_STORAGE_KEY,
          JSON.stringify(list || [])
        );
      } catch {}
    },
    [watchList]
  );

  const saveWatchToStorageDebounced = useCallback(
    (wait = 200) => {
      if (saveWatchTimer.current) {
        clearTimeout(saveWatchTimer.current);
      }
      saveWatchTimer.current = setTimeout(() => {
        saveWatchToStorage(watchList);
      }, Math.max(0, wait));
    },
    [saveWatchToStorage]
  );

  const loadWatchFromStorage = useCallback(() => {
    let watchListData = [];
    try {
      const watchRaw = window.localStorage.getItem(
        RUNNER_WATCHLIST_STORAGE_KEY
      );
      if (watchRaw) {
        const parsed = JSON.parse(watchRaw);
        if (Array.isArray(parsed)) {
          watchListData = parsed.filter(
            (item) =>
              item &&
              typeof item.kind === 'string' &&
              typeof item.id === 'string'
          );
        }
      }
    } catch {}
    return { watchList: watchListData };
  }, []);

  const hydrateWatchFromStorage = useCallback(() => {
    loadParamsFromStorage(); // Load params first to prevent the watchlist update from changing them

    const { watchList: storedWatchList } = loadWatchFromStorage();
    if ((storedWatchList || []).length) {
      updateWatchList(storedWatchList);
    }
  }, [loadWatchFromStorage, loadParamsFromStorage, updateWatchList]);

  // One-time hydration guard
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { watchList: storedWatchList } = loadWatchFromStorage?.() || {};
        if (Array.isArray(storedWatchList) && storedWatchList.length) {
          setWatchList(storedWatchList);
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // hydrate once on mount
  useEffect(() => {
    hydrateWatchFromStorage();
  }, [hydrateWatchFromStorage]);

  // Save to storage whenever watch list changes
  useEffect(() => {
    saveWatchToStorageDebounced();
  }, [watchList]);

  // Sync watch list with parameter editor originals/edits
  useEffect(() => {
    const watchParamIds = new Set(
      (watchList || [])
        .filter((wlItem) => wlItem.kind === 'param')
        .map((wlItem) => wlItem.id)
    );

    // Remove any param originals/edits that are no longer in the watch list
    const keysToRemove = Object.keys(paramOriginals || {}).filter(
      (key) => !watchParamIds.has(key)
    );
    if (keysToRemove.length) {
      keysToRemove.forEach((paramKey) => removeParamInEditor(paramKey));
    }

    if (!watchList.length) {
      return;
    }

    // Ensure any newly added watch list params are seeded in the editor
    watchList.forEach((item) => {
      if (item.kind !== 'param') {
        return;
      }
      const isMissingInEditor =
        !Object.prototype.hasOwnProperty.call(paramOriginals, item.id) ||
        !Object.prototype.hasOwnProperty.call(paramEdits, item.id);
      if (isMissingInEditor) {
        const currentVal = getBaseParamValue(item.id);
        if (typeof currentVal !== 'undefined') {
          addParamsInEditor({ [item.id]: currentVal });
        }
      }
    });
  }, [
    watchList,
    paramOriginals,
    paramEdits,
    getBaseParamValue,
    addParamsInEditor,
    removeParamInEditor,
  ]);

  return {
    // Direct watch list interactions
    // (Viewing)
    watchList,
    hydrated,
    // (Editing)
    addToWatchList,
    removeFromWatchList,
    updateWatchList,
    clearWatchList,
    saveWatchToStorageDebounced,

    // Parameter editor interactions
    // (Viewing)
    paramOriginals,
    paramEdits,
    strictlyChanged,
    getBaseParamValue,
    getParamValueFromKey,
    // (Editing)
    resetParamInEditor,
    editParamInEditor,
    setParamValueForKey,
  };
}

export default useWatchList;
