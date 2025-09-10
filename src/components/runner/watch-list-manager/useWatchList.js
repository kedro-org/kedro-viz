import React, { useRef, useState, useCallback, useEffect } from 'react';
import useParameterEditor from './useParameterEditor';
import { loadNodeData, toggleNodeClicked } from '../../../actions/nodes'; // ensure path is correct

// Keys for persisting Watch list and custom order
const RUNNER_WATCHLIST_STORAGE_KEY = 'kedro_viz_runner_watch_list';

/**
 * useWatchList: Manages a watch list of nodes and parameters, integrating with a parameter editor.
 */
function useWatchList(props) {
  const { dispatch } = props || {};
  const saveWatchTimer = useRef();
  const [watchList, setWatchList] = useState([]);

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
    loadParamsFromStorage(); // Load params first

    const { watchList: storedWatchList } = loadWatchFromStorage();
    if ((storedWatchList || []).length) {
      updateWatchList(storedWatchList);
    }
  }, [loadWatchFromStorage]);

  // hydrate once on mount
  useEffect(() => {
    hydrateWatchFromStorage();
  }, [hydrateWatchFromStorage]);

  // Save to storage whenever watch list changes
  useEffect(() => {
    saveWatchToStorageDebounced();
  }, [watchList]);

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
      const val = getBaseParamValue(paramKey);
      setParamValueForKey(paramKey, val);
      return val;
    },
    [paramEdits, getBaseParamValue]
  );

  const addToWatchList = useCallback(
    (item) => {
      if (!item || !item.kind || !item.id) {
        return;
      }

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
    [getBaseParamValue, setWatchList]
  );

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

  const removeFromWatchList = useCallback(
    (itemId) => {
      if (!itemId) {
        return;
      }

      // Remove from watch list
      setWatchList((prev) => prev.filter((wlItem) => !(wlItem.id === itemId)));
    },
    [setWatchList, watchList]
  );

  const updateWatchList = useCallback(
    (newWatchList) => {
      // Iterate through all parameter keys
      if (!Array.isArray(newWatchList)) {
        return;
      }

      const currentIds = (newWatchList || []).map((item) => item.id);
      currentIds.forEach((itemId) => {
        if (dispatch) {
          dispatch(loadNodeData(itemId));
          dispatch(toggleNodeClicked(itemId));
        }
      });

      // Save watch list
      setWatchList(newWatchList);
    },
    [setWatchList]
  );

  const clearWatchList = useCallback(() => {
    debugger;
    setWatchList([]);
    clearParamsInEditor();
  }, [setWatchList, clearParamsInEditor]);

  return {
    // Direct watch list interactions
    // (Viewing)
    watchList,
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
