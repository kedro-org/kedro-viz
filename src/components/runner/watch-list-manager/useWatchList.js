import React, { useRef, useState, useCallback, useEffect } from 'react';
import useParameterEditor from './useParameterEditor';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { loadNodeData, toggleNodeClicked } from '../../../actions/nodes'; // ensure path is correct
import { current } from '@reduxjs/toolkit';

// Keys for persisting Watch list and custom order
const RUNNER_WATCHLIST_STORAGE_KEY = 'kedro_viz_runner_watch_list';

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
    saveParamsToStorageDebounced,
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

  useEffect(() => {
    saveWatchToStorageDebounced();
  }, [watchList]);

  // --- Watch list persistence/helpers ---
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

  const getParamValue = useCallback(
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
      const val = getParamValue(paramKey);
      setParamValueForKey(paramKey, val);
      return val;
    },
    [paramEdits, getParamValue]
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
    [getParamValue, setWatchList]
  );

  useEffect(() => {
    // Build a Set of current param IDs in the watch list for quick lookup
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
      return; // nothing to seed if list empty
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
        const currentVal = getParamValue(item.id);
        if (typeof currentVal !== 'undefined') {
          addParamsInEditor({ [item.id]: currentVal });
        }
      }
    });
  }, [
    watchList,
    paramOriginals,
    paramEdits,
    getParamValue,
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

  const formatParamValueForCli = useCallback((value) => {
    if (
      value === null ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }
    if (typeof value === 'string') {
      const needsQuotes = /[\s,]/.test(value);
      const escaped = value.replace(/"/g, '\\"');
      return needsQuotes ? `"${escaped}"` : escaped;
    }
    return JSON.stringify(value);
  }, []);

  // Removed param diff + paramsArgString responsibility (handled in useCommandBuilder)

  const ensureOriginalsFor = useCallback(
    (keys) => {
      if (!keys) {
        return;
      }
      const arr = Array.isArray(keys) ? keys : [keys];
      const additions = {};
      arr.forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(paramOriginals, key)) {
          const currentVal = getParamValue(key);
          additions[key] = currentVal;
        }
      });
      if (Object.keys(additions).length > 0) {
        try {
          addParamsInEditor(additions);
        } catch {}
      }
    },
    [paramOriginals, getParamValue, addParamsInEditor]
  );

  const toYamlString = useCallback((value) => {
    try {
      return yamlStringify(value, { indent: 2, lineWidth: 0 });
    } catch {
      return String(value);
    }
  }, []);

  const parseYamlishValue = useCallback((text) => {
    if (text == null) {
      return '';
    }
    const str = String(text);
    if (!str.trim()) {
      return '';
    }
    try {
      return yamlParse(str);
    } catch {
      try {
        return JSON.parse(str);
      } catch {
        return str;
      }
    }
  }, []);

  const hydrateWatchFromStorage = useCallback(() => {
    const { watchList: storedWatchList } = loadWatchFromStorage();
    if ((storedWatchList || []).length) {
      updateWatchList(storedWatchList);
    }
  }, [loadWatchFromStorage]);

  // hydrate once on mount
  useEffect(() => {
    hydrateWatchFromStorage();
  }, [hydrateWatchFromStorage]);

  return {
    // Direct watch list interactions
    watchList,
    addToWatchList,
    removeFromWatchList,
    updateWatchList,
    clearWatchList,
    saveWatchToStorageDebounced,

    // Parameter editor interactions
    paramOriginals,
    paramEdits,
    strictlyChanged,
    resetParamInEditor,
    editParamInEditor,
    // expose helpers
    getParamValue,
    saveParamsToStorageDebounced,
    // Param helpers
    getParamValueFromKey,
    setParamValueForKey,
    toYamlString,
    parseYamlishValue,
  // paramsArgString & update handled in command builder now
    ensureOriginalsFor,
  };
}

export default useWatchList;
