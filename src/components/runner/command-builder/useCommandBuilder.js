import { useState, useEffect, useCallback, useMemo } from 'react';
import { PIPELINE } from '../../../config';
import { fetchKedroEnv } from '../../../utils/runner-api';
import { quoteIfNeeded, buildParamDiffModel } from '../utils/paramsDiff';

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

  // --- Diff Model ---
  const diffModel = useMemo(() => {
    const items = (watchList || []).filter((i) => i.kind === 'param');
    return items.map((item) => {
      const key = item.id;
      const originals = paramOriginals || {};
      const orig = Object.prototype.hasOwnProperty.call(originals, key)
        ? originals[key]
        : getParamValue?.(key);
      const curr = getParamValueFromKey
        ? getParamValueFromKey(key)
        : paramEdits[key];
      return buildParamDiffModel(key, item.name || key, orig, curr);
    });
  }, [
    watchList,
    paramOriginals,
    paramEdits,
    getParamValue,
    getParamValueFromKey,
  ]);

  // Derive parameter change pairs & paramsArgString
  const paramPairs = useMemo(
    () => diffModel.flatMap((d) => d.pairs),
    [diffModel]
  );

  const paramsArgString = useMemo(() => paramPairs.join(','), [paramPairs]);

  // Flag for any param changes
  const hasParamChanges = useMemo(
    () => diffModel.some((d) => d.pairs.length > 0),
    [diffModel]
  );

  // Compute an initial param selection (prioritise first changed, else first item)
  const initialParamSelection = useMemo(() => {
    const changed = diffModel.find((d) => d.pairs.length > 0);
    if (changed) {
      return changed.key;
    }
    return diffModel.length ? diffModel[0].key : null;
  }, [diffModel]);

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
    return paramsArgString
      ? `${base} --params ${quoteIfNeeded(paramsArgString)}`
      : base;
  }, [buildRunCommand, paramsArgString, quoteIfNeeded]);

  // Fetch kedro env once (if not provided)
  useEffect(() => {
    if (kedroEnvProp) {
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const env = await fetchKedroEnv();
        if (mounted && env && env !== kedroEnv) {
          setKedroEnv(env);
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [kedroEnvProp, kedroEnv]);

  return {
    kedroEnv: kedroEnvProp ?? kedroEnv,
    setKedroEnv,
    commandString,
    paramsArgString,
    paramPairs,
    buildRunCommand,
    diffModel,
    hasParamChanges,
    initialParamSelection,
    activePipeline,
    selectedTags,
  };
}

export default useCommandBuilder;
