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
  const isHydratingRef = useRef(false);
  const [isHydrating, setIsHydrating] = useState(false);

  const saveParamsToStorage = useCallback(() => {
    // Do not save while hydration is in progress to avoid clobbering
    // persisted user edits.
    if (isHydratingRef.current) {
      return;
    }
    try {
      window.localStorage.setItem(
        RUNNER_PARAM_STATES_STORAGE_KEY,
        JSON.stringify({ entries: paramEntries })
      );
    } catch {}
  }, [paramEntries]);

  const loadParamsFromStorage = useCallback(() => {
    isHydratingRef.current = true;
    setIsHydrating(true);
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
        // Validate entry shape from storage
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
    } catch {
    } finally {
      setTimeout(() => {
        isHydratingRef.current = false;
        setIsHydrating(false);
      }, 0);
    }
  }, []);

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
      // Block programmatic additions while hydration is in progress.
      if (isHydratingRef.current) {
        return;
      }
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
      // Block user edits while hydration is in progress.
      if (isHydratingRef.current) {
        return;
      }
      if (!paramKey) {
        return;
      }
      setEntries((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, paramKey)) {
          return prev;
        }
        return { ...prev, [paramKey]: { ...prev[paramKey], edit: newValue } };
      });
      saveParamsToStorage();
    },
    [setEntries]
  );

  const resetParam = useCallback(
    (paramKey) => {
      // Block resets while hydrating
      if (isHydratingRef.current) {
        return;
      }
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
      // Block removals while hydrating
      if (isHydratingRef.current) {
        return;
      }
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
    if (isHydratingRef.current) {
      return;
    }
    setParamEntries({});
    try {
      window.localStorage.setItem(
        RUNNER_PARAM_STATES_STORAGE_KEY,
        JSON.stringify({ entries: {} })
      );
    } catch {}
  }, []);

  useEffect(() => {
    loadParamsFromStorage();
  }, [loadParamsFromStorage]);

  useEffect(() => {
    saveParamsToStorage();
  }, [paramEntries, saveParamsToStorage]);

  return {
    paramOriginals,
    paramEdits,
    strictlyChanged,
    isHydrating,
    addParams,
    removeParam,
    clearParams,
    resetParam,
    editParam,
    loadParamsFromStorage,
  };
}

export default useParameterEditor;
