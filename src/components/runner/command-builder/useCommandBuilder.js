import { useState, useEffect, useCallback, useMemo } from 'react';
import { PIPELINE } from '../../../config';
import { fetchKedroEnv } from '../../../utils/runner-api';

/**
 * useCommandBuilder
 * Centralises Kedro command construction and parameter argument string generation.
 * Pure state/data hook – no UI concerns.
 */
function useCommandBuilder({
  activePipeline,
  selectedTags,
  kedroEnv: kedroEnvProp,
  // Param / watch related inputs
  watchList = [],
  paramOriginals = {},
  paramEdits = {},
  // Value access helpers (from watch list / parameter editor)
  getParamValue,
  getParamValueFromKey,
}) {
  const [kedroEnv, setKedroEnv] = useState(kedroEnvProp || null);

  // --- Helpers ---
  const quoteIfNeeded = useCallback((text) => {
    if (!text) {
      return '';
    }
    const str = String(text);
    return /\s/.test(str) ? `"${str.replace(/"/g, '\\"')}"` : str;
  }, []);

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

  const formatParamValueForCli = useCallback((value) => {
    if (value === null || typeof value === 'number' || typeof value === 'boolean') {
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
        orig && typeof orig === 'object' && !Array.isArray(orig) &&
        edited && typeof edited === 'object' && !Array.isArray(edited)
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
              origVal && typeof origVal === 'object' && !Array.isArray(origVal) &&
              editedVal && typeof editedVal === 'object' && !Array.isArray(editedVal)
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

  // Derive parameter change pairs & paramsArgString
  const paramPairs = useMemo(() => {
    const currentWatchList = watchList || [];
    if (!currentWatchList.length) {
      return [];
    }
    const pairs = [];
    currentWatchList.filter((i) => i.kind === 'param').forEach((item) => {
      const key = item.id;
      const prefixName = normalizeParamPrefix(item.name || item.id);
      const originals = paramOriginals || {};
      const orig = Object.prototype.hasOwnProperty.call(originals, key)
        ? originals[key]
        : getParamValue?.(key);
      const curr = getParamValueFromKey ? getParamValueFromKey(key) : paramEdits[key];
      pairs.push(...collectParamDiffs(orig, curr, prefixName));
    });
    return pairs;
  }, [watchList, paramOriginals, paramEdits, getParamValue, getParamValueFromKey, normalizeParamPrefix, collectParamDiffs]);

  const paramsArgString = useMemo(() => paramPairs.join(','), [paramPairs]);

  // Build base command (without --params)
  const buildRunCommand = useCallback(() => {
    try {
      const parts = ['kedro', 'run'];
      const env = kedroEnvProp ?? kedroEnv;
      if (env && env !== 'local') {
        parts.push('-e', env);
      }
      if (activePipeline && activePipeline !== PIPELINE.DEFAULT) {
        parts.push('-p', quoteIfNeeded(activePipeline));
      }
      if (selectedTags && selectedTags.length) {
        parts.push('-t', selectedTags.join(','));
      }
      return parts.join(' ');
    } catch {
      return 'kedro run';
    }
  }, [activePipeline, selectedTags, kedroEnv, kedroEnvProp, quoteIfNeeded]);

  const commandString = useMemo(() => {
    const base = buildRunCommand();
    return paramsArgString ? `${base} --params ${quoteIfNeeded(paramsArgString)}` : base;
  }, [buildRunCommand, paramsArgString, quoteIfNeeded]);

  // Fetch kedro env once (if not provided)
  useEffect(() => {
    if (kedroEnvProp) {
      return; // controlled externally
    }
    let mounted = true;
    (async () => {
      try {
        const env = await fetchKedroEnv();
        if (mounted && env && env !== kedroEnv) {
          setKedroEnv(env);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [kedroEnvProp, kedroEnv]);

  return {
    // Environment
    kedroEnv: kedroEnvProp ?? kedroEnv,
    setKedroEnv,
    // Command & params
    commandString,
    paramsArgString,
    paramPairs,
    buildRunCommand,
    // Helpers
    quoteIfNeeded,
    normalizeParamPrefix,
    collectParamDiffs,
    formatParamValueForCli,
  };
}

export default useCommandBuilder;