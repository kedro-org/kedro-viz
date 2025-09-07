import { set } from 'lodash';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import useParameterEditor from './useParameterEditor';
import watch from 'redux-watch';
import { use } from 'react';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';

// Keys for persisting Watch list and custom order
const RUNNER_WATCHLIST_STORAGE_KEY = 'kedro_viz_runner_watch_list';
const RUNNER_WATCH_CUSTOM_ORDER_STORAGE_KEY =
  'kedro_viz_runner_watch_custom_order';

function useWatchList(props) {
  const saveWatchTimer = useRef();
  const [watchList, setWatchList] = useState([]);  

  const [paramsArgString, setParamsArgString] = useState('');

  const {
    paramOriginals,
    paramEdits,
    strictlyChanged,
    addParams: addParamsInEditor,
    removeParam: removeParamInEditor,
    resetParam: resetParamInEditor,
    editParam: editParamInEditor,
    saveParamsToStorageDebounced,

  } = useParameterEditor();


  const getParamValue = useCallback(
    (paramKey) => {
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
        return val;
      }
      return "undefined";
    },
    [props]
    );

    const getEditedParamValue = useCallback(
      (paramKey) => {
        const edits = paramEdits || {};
        if (Object.prototype.hasOwnProperty.call(edits, paramKey)) {
          const val = edits[paramKey];
          if (typeof val !== 'undefined') {
            return val;
          }
        }
        return getParamValue(paramKey);
      },
      [paramEdits, getParamValue]
    );

  const addToWatchList = useCallback(
    (item) => {
      if (!item || !item.kind || !item.id) {
        return;
      }
      setWatchList((prev) => {
        const exists = prev.some((wlItem) => wlItem.kind === item.kind && wlItem.id === item.id);
        if (exists) {
            return prev;
        }

        return [...prev, item];
      });

      // Register parameter in the editor
      if (item.kind === "param") {
        addParamsInEditor({ [item.id]: getParamValue(item.id) });
      }
    },
    [getParamValue, addParamsInEditor]
  );

  const removeFromWatchList = useCallback(
    (itemId) => {

      const kind = watchList.find((wlItem) => wlItem.id === itemId)?.kind;
      if (!itemId || !kind) {
        return;
      }
      setWatchList((prev) =>
        prev.filter((wlItem) => !(wlItem.kind === kind && wlItem.id === itemId))
      );

      if (kind === "param") {
        removeParamInEditor(itemId);
      }
    },
    [removeParamInEditor]
  );


  const updateWatchList = useCallback(
    (newList) => {
        // Iterate through all parameter keys
        if (!Array.isArray(newList)) {
            return;
        }

        // Remove parameters that are no longer in the watch list
        const currentParamKeys = (watchList || [])
            .filter((item) => item.kind === 'param')
            .map((item) => item.id);
        currentParamKeys.forEach((key) => {
            if (!newList.some((item) => item.kind === 'param' && item.id === key)) {
                removeFromWatchList(key);
            }
        });

        // Add new parameters from the new list
        newList.forEach((item) => {
            addToWatchList(item);
        });

        // Save watch list
        setWatchList(newList);
    },
    [setWatchList]
  );

  const clearWatchList = useCallback(() => {
    const currentParamKeys = (watchList || [])
        .filter((item) => item.kind === 'param')
        .map((item) => item.id);

    currentParamKeys.forEach((key) => {
        removeFromWatchList(key);
    });
    setWatchList([]);
  }, [setWatchList]);


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
    [watchList,]
  );

  const saveWatchToStorageDebounced = useCallback(
    (list, order, wait = 200) => {
      if (saveWatchTimer.current) {
        clearTimeout(saveWatchTimer.current);
      }
      saveWatchTimer.current = setTimeout(() => {
        saveWatchToStorage(list, order);
      }, Math.max(0, wait));
    },
    [saveWatchToStorage]
  );
  
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

  const collectParamDiffs = useCallback(
    (orig, edited, prefix) => {
      const pairs = [];
      if (typeof orig === 'undefined') {
        if (typeof edited === 'undefined') {
          return pairs;
        }
        if (edited && typeof edited === 'object' && !Array.isArray(edited)) {
          Object.keys(edited).forEach((k) => {
            const val = edited[k];
            const keyPath = `${prefix}.${k}`;
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              pairs.push(...collectParamDiffs(undefined, val, keyPath));
            } else {
              pairs.push(`${keyPath}=${formatParamValueForCli(val)}`);
            }
          });
        } else {
          pairs.push(`${prefix}=${formatParamValueForCli(edited)}`);
        }
        return pairs;
      }
      if (
        orig &&
        typeof orig === 'object' &&
        !Array.isArray(orig) &&
        edited &&
        typeof edited === 'object' &&
        !Array.isArray(edited)
      ) {
        const keys = new Set([...Object.keys(orig), ...Object.keys(edited)]);
        keys.forEach((k) => {
          const origVal = orig[k];
          const editedVal = edited[k];
          if (typeof editedVal === 'undefined') {
            return;
          }
          const keyPath = `${prefix}.${k}`;
          if (
            origVal &&
            typeof origVal === 'object' &&
            !Array.isArray(origVal) &&
            editedVal &&
            typeof editedVal === 'object' &&
            !Array.isArray(editedVal)
          ) {
            pairs.push(...collectParamDiffs(origVal, editedVal, keyPath));
          } else if (JSON.stringify(origVal) !== JSON.stringify(editedVal)) {
            pairs.push(`${keyPath}=${formatParamValueForCli(editedVal)}`);
          }
        });
        return pairs;
      }
      if (JSON.stringify(orig) !== JSON.stringify(edited)) {
        pairs.push(`${prefix}=${formatParamValueForCli(edited)}`);
      }
      return pairs;
    },
    [formatParamValueForCli]
  );

  const normalizeParamPrefix = useCallback((text) => {
    if (text == null || text === '') {
      return '';
    }
    try {
      return String(text).replace(/^params:/, '');
    } catch {
      return text;
    }
  }, []);

  const getEditedParamChangesPairs = useCallback(() => {
    const watchListItems = watchList || [];
    if (!watchListItems.length) {
      return [];
    }
    const pairs = [];
    (watchListItems.filter((i) => i.kind === 'param') || []).forEach(
      (wlItem) => {
        const key = wlItem.id;
        const prefixName = normalizeParamPrefix(wlItem.name || wlItem.id);
        const originals = paramOriginals || {};
        const orig = Object.prototype.hasOwnProperty.call(originals, key)
          ? originals[key]
          : getParamValue(key);
        const curr = getEditedParamValue(key);
        pairs.push(...collectParamDiffs(orig, curr, prefixName));
      }
    );
    return pairs;
  }, [
    watchList,
    paramOriginals,
    getParamValue,
    getEditedParamValue,
    normalizeParamPrefix,
    collectParamDiffs,
  ]);

  const updateParamsArgString = useCallback(() => {
    try {
      const pairs = getEditedParamChangesPairs();
      const nextStr = pairs.join(',');
      if (nextStr !== (paramsArgString || '')) {
        setParamsArgString(nextStr);
      }
    } catch {}
  }, [
    getEditedParamChangesPairs,
    paramsArgString,
  ]);

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
  getEditedParamValue,
  normalizeParamPrefix,
  collectParamDiffs,
  toYamlString,
  parseYamlishValue,
  paramsArgString,
  updateParamsArgString,
  ensureOriginalsFor,

  };
}

export default useWatchList;