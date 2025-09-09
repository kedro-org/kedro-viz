import React, { useRef, useState, useCallback, useEffect } from 'react';

// Keys for persisting parameter edits and originals
const RUNNER_PARAM_EDITS_STORAGE_KEY = 'kedro_viz_runner_param_edits';
const RUNNER_PARAM_ORIGINALS_STORAGE_KEY = 'kedro_viz_runner_param_originals';

function useParameterEditor() {
  const saveParamsTimer = useRef();
  const [paramOriginals, setParamOriginals] = useState({});
  const [paramEdits, setParamEdits] = useState({});
  const [strictlyChanged, setStrictlyChanged] = useState({});

  const computeStrictlyChanged = useCallback(() => {
    const result = {};
    const watchParamKeys = Object.keys(paramOriginals || {});
    watchParamKeys.forEach((key) => {
      const orig = paramOriginals[key];
      const current = paramEdits[key];
      if (JSON.stringify(orig) !== JSON.stringify(current)) {
        result[key] = true;
      }
    });
    return result;
  }, [paramOriginals, paramEdits]);

  const updateStrictlyChanged = useCallback(() => {
    try {
      const next = computeStrictlyChanged();
      setStrictlyChanged((prev) => {
        if (JSON.stringify(next) === JSON.stringify(prev || {})) {
          return prev;
        }
        return next;
      });
    } catch {}
  }, [computeStrictlyChanged]);

  const addParams = useCallback((newParams) => {
    if (!newParams || Object.keys(newParams).length === 0) {
      return;
    }

    // Only add parameters that are not already present
    setParamOriginals((prev) => {
      const updated = { ...(prev || {}) };
      Object.keys(newParams || {}).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(updated, key)) {
          updated[key] = newParams[key];
        }
      });
      return updated;
    });
    setParamEdits((prev) => {
      const updated = { ...(prev || {}) };
      Object.keys(newParams || {}).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(updated, key)) {
          updated[key] = newParams[key];
        }
      });
      return updated;
    });
  }, []);

  const removeParam = useCallback((paramKey) => {
    setParamOriginals((prev) => {
      const updated = { ...(prev || {}) };
      delete updated[paramKey];
      return updated;
    });
    setParamEdits((prev) => {
      const updated = { ...(prev || {}) };
      delete updated[paramKey];
      return updated;
    });
    setStrictlyChanged((prev) => {
      const updated = { ...(prev || {}) };
      delete updated[paramKey];
      return updated;
    });
  }, []);

  const clearParams = useCallback(() => {
    setParamOriginals({});
    setParamEdits({});
    setStrictlyChanged({});
  }, []);

  const saveParamsToStorage = useCallback(() => {
    try {
      window.localStorage.setItem(
        RUNNER_PARAM_EDITS_STORAGE_KEY,
        JSON.stringify(paramEdits || {})
      );
      window.localStorage.setItem(
        RUNNER_PARAM_ORIGINALS_STORAGE_KEY,
        JSON.stringify(paramOriginals || {})
      );
    } catch {}
  }, [paramEdits, paramOriginals]);

  const saveParamsToStorageDebounced = useCallback(
    (wait = 200) => {
      if (saveParamsTimer.current) {
        clearTimeout(saveParamsTimer.current);
      }
      saveParamsTimer.current = setTimeout(() => {
        saveParamsToStorage();
      }, Math.max(0, wait));
    },
    [saveParamsToStorage]
  );

  const resetParam = useCallback(
    (paramKey) => {
      if (!paramKey) {
        return undefined;
      }
      setParamEdits((prev) => {
        const updated = { ...(prev || {}) };
        if (!Object.prototype.hasOwnProperty.call(paramOriginals, paramKey)) {
          delete updated[paramKey];
        } else {
          updated[paramKey] = paramOriginals[paramKey];
        }
        return updated;
      });
    },
    [paramOriginals]
  );

  const editParam = useCallback((paramKey, newValue) => {
    setParamEdits((prev) => ({ ...(prev || {}), [paramKey]: newValue }));
  }, []);

  const loadParamEditsFromStorage = useCallback(() => {
    try {
      const editsRaw = window.localStorage.getItem(
        RUNNER_PARAM_EDITS_STORAGE_KEY
      );
      const originalsRaw = window.localStorage.getItem(
        RUNNER_PARAM_ORIGINALS_STORAGE_KEY
      );
      const edits = editsRaw ? JSON.parse(editsRaw) : {};
      const originals = originalsRaw ? JSON.parse(originalsRaw) : {};
      return { edits, originals };
    } catch {
      return { edits: {}, originals: {} };
    }
  }, []);

  const hydrateParamEditsFromStorage = useCallback(() => {
    const { edits, originals } = loadParamEditsFromStorage();
    const hasEdits = edits && Object.keys(edits).length > 0;
    const hasOriginals = originals && Object.keys(originals).length > 0;
    if (!hasEdits && !hasOriginals) {
      return;
    }
    if (hasEdits) {
      setParamEdits(edits);
    }
    if (hasOriginals) {
      setParamOriginals(originals);
    }
  }, [loadParamEditsFromStorage]);

  useEffect(() => {
    saveParamsToStorageDebounced();
  }, [paramEdits, paramOriginals]);

  useEffect(() => {
    updateStrictlyChanged();
  }, [paramOriginals, paramEdits, updateStrictlyChanged]);

  // useEffect(() => {
  //   hydrateParamEditsFromStorage();
  // }, []);

  return {
    paramOriginals,
    paramEdits,
    strictlyChanged,
    addParams,
    removeParam,
    clearParams,
    resetParam,
    editParam,
    saveParamsToStorageDebounced,
  };
}

export default useParameterEditor;
