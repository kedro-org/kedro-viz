import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';

// Keys for persisting parameter edits and originals
const RUNNER_PARAM_STATES_STORAGE_KEY = 'kedro_viz_runner_param_states';

function useParameterEditor() {
  // Unified per-key entry: { original, edit }
  const [paramEntries, setParamEntries] = useState({}); // key -> { original, edit }

  const paramOriginals = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(paramEntries).map(([key, entry]) => [
          key,
          entry.original,
        ])
      ),
    [paramEntries]
  );
  const paramEdits = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(paramEntries).map(([key, entry]) => [key, entry.edit])
      ),
    [paramEntries]
  );
  const strictlyChanged = useMemo(() => {
    const changed = {};
    Object.entries(paramEntries).forEach(([key, entry]) => {
      if (JSON.stringify(entry.original) !== JSON.stringify(entry.edit)) {
        changed[key] = true;
      }
    });
    return changed;
  }, [paramEntries]);

  // Persistence
  const saveParamsToStorage = useCallback(() => {
    try {
      window.localStorage.setItem(
        RUNNER_PARAM_STATES_STORAGE_KEY,
        JSON.stringify({ entries: paramEntries })
      );
    } catch {}
  }, [paramEntries]);

  const loadParamsFromStorage = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(RUNNER_PARAM_STATES_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return;
      }
      const entries =
        parsed.entries &&
        typeof parsed.entries === 'object' &&
        !Array.isArray(parsed.entries)
          ? parsed.entries
          : {};
      setParamEntries((prev) => {
        if (Object.keys(prev).length) {
          return prev; // don't overwrite existing
        }
        // Validate entry shape
        const cleaned = {};
        Object.entries(entries).forEach(([key, entry]) => {
          if (entry && typeof entry === 'object') {
            cleaned[key] = {
              original: entry.original,
              edit: Object.prototype.hasOwnProperty.call(entry, 'edit')
                ? entry.edit
                : entry.original,
            };
          }
        });
        return cleaned;
      });
    } catch {}
  }, []);

  // Generic state updater ensuring strictlyChanged consistency
  // Helper to update entries immutably
  const setEntries = useCallback((updater) => {
    setParamEntries((prev) => {
      const next = updater(prev);
      if (!next) {
        return prev;
      }
      if (JSON.stringify(prev) === JSON.stringify(next)) {
        return prev;
      }
      return next;
    });
  }, []);

  const addParams = useCallback(
    (newParams) => {
      if (!newParams || !Object.keys(newParams).length) {
        return;
      }
      setEntries((prev) => {
        const next = { ...prev };
        Object.entries(newParams).forEach(([key, value]) => {
          if (!Object.prototype.hasOwnProperty.call(next, key)) {
            next[key] = { original: value, edit: value };
          }
        });
        return next;
      });
    },
    [setEntries]
  );

  const editParam = useCallback(
    (paramKey, newValue) => {
      if (!paramKey) {
        return;
      }
      setEntries((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, paramKey)) {
          return prev;
        }
        return { ...prev, [paramKey]: { ...prev[paramKey], edit: newValue } };
      });
    },
    [setEntries]
  );

  const resetParam = useCallback(
    (paramKey) => {
      if (!paramKey) {
        return;
      }
      setEntries((prev) => {
        if (!prev[paramKey]) {
          return prev;
        }
        return {
          ...prev,
          [paramKey]: { ...prev[paramKey], edit: prev[paramKey].original },
        };
      });
    },
    [setEntries]
  );

  const removeParam = useCallback(
    (paramKey) => {
      if (!paramKey) {
        return;
      }
      setEntries((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, paramKey)) {
          return prev;
        }
        const next = { ...prev };
        delete next[paramKey];
        return next;
      });
    },
    [setEntries]
  );

  const clearParams = useCallback(() => {
    setParamEntries({});
    try {
      window.localStorage.setItem(
        RUNNER_PARAM_STATES_STORAGE_KEY,
        JSON.stringify({ entries: {} })
      );
    } catch {}
  }, []);

  useEffect(() => {
    saveParamsToStorage();
  }, [paramEntries, saveParamsToStorage]);

  // Hydrate once on mount
  useEffect(() => {
    loadParamsFromStorage();
  }, [loadParamsFromStorage]);

  return {
    paramOriginals,
    paramEdits,
    strictlyChanged,
    addParams,
    removeParam,
    clearParams,
    resetParam,
    editParam,
  };
}

export default useParameterEditor;
