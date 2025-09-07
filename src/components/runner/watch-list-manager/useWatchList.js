import { set } from 'lodash';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import useParameterEditor from './useParameterEditor';
import watch from 'redux-watch';
import { use } from 'react';

// Keys for persisting Watch list and custom order
const RUNNER_WATCHLIST_STORAGE_KEY = 'kedro_viz_runner_watch_list';
const RUNNER_WATCH_CUSTOM_ORDER_STORAGE_KEY =
  'kedro_viz_runner_watch_custom_order';

function useWatchList(props) {
  const saveWatchTimer = useRef();
  const [watchList, setWatchList] = useState([]);  

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

  const addToWatchList = useCallback(
    (item) => {
      if (!item || !item.kind || !item.id) {
        return;
      }
      setWatchList((prev) => {
        const exists = prev.some((w) => w.kind === item.kind && w.id === item.id);
        if (exists) return prev;

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

      const kind = watchList.find((w) => w.id === itemId)?.kind;
      if (!itemId || !kind) {
        return;
      }
      setWatchList((prev) =>
        prev.filter((w) => !(w.kind === kind && w.id === itemId))
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

  };
}

export default useWatchList;