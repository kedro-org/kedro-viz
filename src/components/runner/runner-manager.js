import JobListPanel from './JobListPanel';
import { useState, useRef, useEffect, useCallback } from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
// Reuse existing metadata panel styles
import '../metadata/styles/metadata.scss';
import MetaData from '../metadata/metadata';
import ControlPanel from './control-panel';
import WatchPanel, {
  onFlowchartNodeClickImpl,
  onFlowchartNodeDoubleClickImpl,
} from './watch-panel';
import WatchListDialog from './watch-list-dialog';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { getVisibleNodes } from '../../selectors/nodes';
import { getTagData } from '../../selectors/tags';
import './runner-manager.scss';
import { sanitizedPathname } from '../../utils';
import {
  startKedroCommand,
  getKedroCommandStatus,
  cancelKedroCommand,
  fetchKedroEnv,
} from '../../utils/runner-api';
import { PIPELINE } from '../../config';
import { toggleNodeClicked, loadNodeData } from '../../actions/nodes';
import { getClickedNodeMetaData } from '../../selectors/metadata';

// Key for persisting runner jobs across page changes
const RUNNER_JOBS_STORAGE_KEY = 'kedro_viz_runner_jobs';
// Keys for persisting Watch list and custom order
const RUNNER_WATCHLIST_STORAGE_KEY = 'kedro_viz_runner_watch_list';
const RUNNER_WATCH_CUSTOM_ORDER_STORAGE_KEY =
  'kedro_viz_runner_watch_custom_order';
// Keys for persisting parameter edits and originals
const RUNNER_PARAM_EDITS_STORAGE_KEY = 'kedro_viz_runner_param_edits';
const RUNNER_PARAM_ORIGINALS_STORAGE_KEY = 'kedro_viz_runner_param_originals';

/**
 * KedroRunManager
 * A visual draft page for starting and monitoring Kedro runs.
 * No functional wiring — purely presentational scaffolding you can hook up later.
 */

function KedroRunManager(props) {
  // Refs
  const commandInputRef = useRef();
  const jobsPanelRef = useRef();
  const jobsPanelBodyRef = useRef();
  const logRefs = useRef({});
  const jobPollers = useRef({});
  const toastTimer = useRef();
  const saveWatchTimer = useRef();
  const saveParamsTimer = useRef();
  const lastSid = useRef();
  const pendingSid = useRef(null);

  // State
  const [jobs, setJobs] = useState([]);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [watchList, setWatchList] = useState([]);
  const [customOrder, setCustomOrder] = useState({
    param: false,
    dataset: false,
  });
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState({});
  const [tempModalSelections, setTempModalSelections] = useState({});
  const [watchSearch, setWatchSearch] = useState('');
  const [watchTab, setWatchTab] = useState('parameters');
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadataMode, setMetadataMode] = useState(null);
  const [selectedParamKey, setSelectedParamKey] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [yamlText, setYamlText] = useState('');
  const [metaEditText, setMetaEditText] = useState('');
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [paramsDialogSelectedKey, setParamsDialogSelectedKey] = useState(null);
  const [params, setParams] = useState({});
  const [paramEdits, setParamEdits] = useState({});
  const [editedParameters, setEditedParameters] = useState({});
  const [paramOriginals, setParamOriginals] = useState({});
  const [strictlyChanged, setStrictlyChanged] = useState({});
  const [paramsArgString, setParamsArgString] = useState('');
  const [isClearJobsModalOpen, setIsClearJobsModalOpen] = useState(false);
  const [isClearJobModalOpen, setIsClearJobModalOpen] = useState(false);
  const [clearJobModalJobId, setClearJobModalJobId] = useState(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [logsModalJobId, setLogsModalJobId] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [kedroEnv, setKedroEnv] = useState(null);

  // Destructure frequently used props to satisfy exhaustive-deps and avoid adding entire props object
  const { paramNodes = [], datasets = [], dispatch } = props || {};

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
        if (typeof val === 'string' && val === paramKey) {
          if (Object.prototype.hasOwnProperty.call(params || {}, paramKey)) {
            return (params || {})[paramKey];
          }
        }
        return val;
      }
      return (params || {})[paramKey];
    },
    [props, params]
  );

  const getEditedParamValue = useCallback(
    (paramKey) => {
      const edited = editedParameters || {};
      if (Object.prototype.hasOwnProperty.call(edited, paramKey)) {
        const val = edited[paramKey];
        if (typeof val !== 'undefined') {
          return val;
        }
      }
      return getParamValue(paramKey);
    },
    [editedParameters, getParamValue]
  );

  // --- Missing helpers restored ---
  // Safely wrap a params argument string in single quotes if it contains spaces or shell meta chars
  const quoteIfNeeded = useCallback((text) => {
    if (!text) {
      return '';
    }
    const str = String(text);
    return str.includes(' ') ? `"${str.replace(/"/g, '\\"')}"` : str;
  }, []);

  // Build the base kedro run command (excluding --params which is handled separately)
  const buildRunCommand = useCallback(() => {
    try {
      const parts = ['kedro', 'run'];
      const env = props?.kedroEnv ?? kedroEnv;
      const activePipeline = props?.activePipeline;
      const selectedTags = props?.selectedTags || [];
      if (env && env !== 'local') {
        parts.push('-e');
        parts.push(env);
      }
      if (activePipeline && activePipeline !== PIPELINE.DEFAULT) {
        parts.push('-p');
        parts.push(quoteIfNeeded(activePipeline));
      }
      if (selectedTags.length) {
        parts.push('-t');
        parts.push(selectedTags.join(','));
      }
      return parts.join(' ');
    } catch {
      return 'kedro run';
    }
  }, [
    props?.kedroEnv,
    props?.activePipeline,
    props?.selectedTags,
    kedroEnv,
    quoteIfNeeded,
  ]);

  // Update the visible command input when relevant props/state change
  const updateCommandFromProps = useCallback(() => {
    const baseCmd = buildRunCommand();
    const paramsOverride = paramsArgString;
    const cmd = paramsOverride
      ? `${baseCmd} --params ${quoteIfNeeded(paramsOverride)}`
      : baseCmd;
    if (commandInputRef?.current && commandInputRef.current.value !== cmd) {
      commandInputRef.current.value = cmd;
    }
  }, [buildRunCommand, paramsArgString, quoteIfNeeded]);

  // Fetch kedro environment info from backend
  const fetchAndSetKedroEnv = useCallback(async () => {
    try {
      const env = await fetchKedroEnv();
      if (env && env !== kedroEnv) {
        setKedroEnv(env);
      }
    } catch {
      // eslint-disable-next-line no-console
      console.warn('[Runner] Failed to fetch Kedro env');
    }
  }, [kedroEnv]);

  // Helper to read sid from URL (placed before syncMetadataFromSid to avoid TDZ)
  const getSidFromUrl = useCallback(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search || '');
      return searchParams.get('sid') || searchParams.get('selected_id') || '';
    } catch (e) {
      return '';
    }
  }, []);

  // Sync metadata panel from sid in URL (minimal implementation to avoid undefined errors before editors defined)
  const syncMetadataFromSid = useCallback(
    (props) => {
      const sid = getSidFromUrl();
      if (!sid || sid === lastSid.current) {
        return;
      }
      // Defer actual open until callbacks definitely initialised
      pendingSid.current = sid;
    },
    [getSidFromUrl]
  );

  const showToast = useCallback((message, duration = 2000) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToastMessage(String(message || ''));
    setToastVisible(true);
    toastTimer.current = setTimeout(() => {
      setToastVisible(false);
    }, Math.max(0, duration));
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    setToastVisible(false);
  }, []);

  const computeStrictlyChanged = useCallback(() => {
    const result = {};
    const watchParamKeys = (watchList || [])
      .filter((i) => i.kind === 'param')
      .map((i) => i.id);
    if (!watchParamKeys.length) {
      return result;
    }
    const originals = paramOriginals || {};
    watchParamKeys.forEach((key) => {
      const orig = Object.prototype.hasOwnProperty.call(originals, key)
        ? originals[key]
        : getParamValue(key);
      const current = getEditedParamValue(key);
      if (JSON.stringify(orig) !== JSON.stringify(current)) {
        result[key] = true;
      }
    });
    return result;
  }, [watchList, paramOriginals, getParamValue, getEditedParamValue]);

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

  const loadParamsFromStorage = useCallback(() => {
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
        setParamOriginals((prev) => ({ ...prev, ...additions }));
      }
    },
    [paramOriginals, getParamValue]
  );

  const refreshWatchParamsMetadata = useCallback(() => {
    const list = watchList || [];
    if (!list.length || !props.dispatch) {
      return;
    }
    const paramIds = list
      .filter((item) => item.kind === 'param')
      .map((i) => i.id);
    paramIds.forEach((id) => {
      try {
        props.dispatch(loadNodeData(id));
      } catch {}
    });
  }, [watchList, props]);

  const saveWatchToStorage = useCallback(
    (list = watchList, order = customOrder) => {
      try {
        window.localStorage.setItem(
          RUNNER_WATCHLIST_STORAGE_KEY,
          JSON.stringify(list || [])
        );
        window.localStorage.setItem(
          RUNNER_WATCH_CUSTOM_ORDER_STORAGE_KEY,
          JSON.stringify({
            param: !!order?.param,
            dataset: !!order?.dataset,
          })
        );
      } catch {}
    },
    [watchList, customOrder]
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
        updateCommandFromProps();
      }
    } catch {}
  }, [
    getEditedParamChangesPairs,
    paramsArgString,
    updateCommandFromProps,
    props,
  ]);

  const confirmAddSelected = useCallback(() => {
    const stagedKeys = new Set(Object.keys(selectedToAdd || {}));
    const prevList = watchList || [];
    const prevParams = prevList.filter((i) => i.kind === 'param');
    const prevDatasets = prevList.filter((i) => i.kind === 'dataset');

    const nextParamIds = Array.from(stagedKeys)
      .map((k) => k.split(':'))
      .filter(([kind]) => kind === 'param')
      .map(([, id]) => id);
    const nextDatasetIds = Array.from(stagedKeys)
      .map((k) => k.split(':'))
      .filter(([kind]) => kind === 'dataset')
      .map(([, id]) => id);

    const nextParamIdSet = new Set(nextParamIds);
    const nextDatasetIdSet = new Set(nextDatasetIds);

    const keptParamItems = prevParams.filter((paramItem) =>
      nextParamIdSet.has(paramItem.id)
    );
    const addedParamItems = nextParamIds
      .filter((id) => !prevParams.some((paramItem) => paramItem.id === id))
      .map((id) => {
        const node = (props.paramNodes || []).find(
          (nodeItem) => nodeItem.id === id
        );
        return { kind: 'param', id, name: node?.name || id };
      });
    const nextParamItems = [...keptParamItems, ...addedParamItems];

    const keptDatasetItems = prevDatasets.filter((d) =>
      nextDatasetIdSet.has(d.id)
    );
    const addedDatasetItems = nextDatasetIds
      .filter((id) => !prevDatasets.some((d) => d.id === id))
      .map((id) => {
        const dataset = (props.datasets || []).find((x) => x.id === id);
        return { kind: 'dataset', id, name: dataset?.name || id };
      });
    const nextDatasetItems = [...keptDatasetItems, ...addedDatasetItems];

    const nextWatchList = [...nextParamItems, ...nextDatasetItems];

    const nextEdited = Object.keys(editedParameters || {}).reduce(
      (acc, key) => {
        if (nextParamIdSet.has(key)) {
          acc[key] = editedParameters[key];
        }
        return acc;
      },
      {}
    );
    nextParamIds.forEach((id) => {
      if (!Object.prototype.hasOwnProperty.call(nextEdited, id)) {
        const val = getParamValue(id);
        if (typeof val !== 'undefined') {
          nextEdited[id] = val;
        }
      }
    });

    setWatchList(nextWatchList);
    setIsWatchModalOpen(false);
    setSelectedToAdd({});
    setTempModalSelections({});
    setEditedParameters(nextEdited);

    saveWatchToStorageDebounced();
    try {
      ensureOriginalsFor(nextParamIds);
      refreshWatchParamsMetadata();
    } catch {}
    updateStrictlyChanged();
    updateParamsArgString();
  }, [
    selectedToAdd,
    watchList,
    editedParameters,
    props.paramNodes,
    props.datasets,
    getParamValue,
    saveWatchToStorageDebounced,
    ensureOriginalsFor,
    refreshWatchParamsMetadata,
    updateStrictlyChanged,
    updateParamsArgString,
  ]);

  const removeParamFromWatchList = useCallback(
    (paramKey) => {
      if (!paramKey) {
        return;
      }
      setWatchList((prev) =>
        (prev || []).filter(
          (item) => !(item.kind === 'param' && item.id === paramKey)
        )
      );
      setParamOriginals((prev) => {
        const next = { ...(prev || {}) };
        delete next[paramKey];
        return next;
      });
      setEditedParameters((prev) => {
        const next = { ...(prev || {}) };
        delete next[paramKey];
        return next;
      });
      setParamEdits((prev) => {
        const next = { ...(prev || {}) };
        delete next[paramKey];
        return next;
      });
      setParams((prev) => {
        const next = { ...(prev || {}) };
        delete next[paramKey];
        return next;
      });
      setStrictlyChanged((prev) => {
        const next = { ...(prev || {}) };
        delete next[paramKey];
        return next;
      });
      saveWatchToStorageDebounced();
      updateParamsArgString();
      saveParamsToStorageDebounced();
    },
    [
      saveWatchToStorageDebounced,
      updateParamsArgString,
      saveParamsToStorageDebounced,
    ]
  );

  // --- Lifecycle: componentDidMount, componentWillUnmount, componentDidUpdate ---
  useEffect(() => {
    // On mount: hydrate jobs, watch, params, fetch env, sync metadata, add popstate
    hydrateJobsFromStorage();
    hydrateWatchFromStorage();
    try {
      setParamOriginals(JSON.parse(JSON.stringify(params || {})));
    } catch (e) {
      setParamOriginals({ ...(params || {}) });
    }
    fetchAndSetKedroEnv();
    updateCommandFromProps();
    updateParamsArgString();
    updateStrictlyChanged();
    hydrateParamsFromStorage();
    syncMetadataFromSid();
    window.addEventListener('popstate', syncMetadataFromSid);
    return () => {
      // On unmount: clear pollers, remove popstate
      Object.values(jobPollers.current || {}).forEach((timerId) => {
        try {
          clearInterval(timerId);
        } catch (e) {}
      });
      jobPollers.current = {};
      window.removeEventListener('popstate', syncMetadataFromSid);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // componentDidUpdate logic for prop/state changes
  useEffect(() => {
    // pipeline/tags/env changes
    updateCommandFromProps();
    // If watchList changes, refresh metadata, originals, strictlyChanged, paramsArgString
    refreshWatchParamsMetadata();
    // ...other logic from class componentDidUpdate can be ported here as needed...
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.activePipeline, props.selectedTags, kedroEnv, watchList]);

  // --- Metadata editor handlers ---
  const onMetaEditChange = (e) => setMetaEditText(e.target.value);
  const onMetaEditSave = () => {
    setYamlText(metaEditText || '');
    saveParamYaml();
  };
  const onMetaEditReset = () => resetParamYaml();

  const getCurrentCommandString = useCallback(() => {
    const baseCmd = buildRunCommand();
    return paramsArgString
      ? `${baseCmd} --params ${quoteIfNeeded(paramsArgString)}`
      : baseCmd;
  }, [buildRunCommand, paramsArgString, quoteIfNeeded, props]);

  const copyCommandToClipboard = useCallback(async () => {
    try {
      const text = commandInputRef.current?.value || getCurrentCommandString();
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = commandInputRef.current;
        if (input) {
          input.focus();
          input.select();
          document.execCommand('copy');
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
      showToast('Copied command to clipboard successfully');
    } catch {
      showToast('Copy failed');
    }
  }, [commandInputRef, getCurrentCommandString, showToast]);

  // --- Parameter helpers/persistence ---
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

  const hydrateParamsFromStorage = useCallback(() => {
    const { edits, originals } = loadParamsFromStorage();
    const hasEdits = edits && Object.keys(edits).length > 0;
    const hasOriginals = originals && Object.keys(originals).length > 0;
    if (!hasEdits && !hasOriginals) {
      return;
    }
    if (hasEdits) {
      setParamEdits(edits);
      setEditedParameters(edits);
      setParams((prev) => ({ ...(prev || {}), ...edits }));
    }
    if (hasOriginals) {
      setParamOriginals(originals);
    }
    updateStrictlyChanged();
    updateParamsArgString();
    updateCommandFromProps();
  }, [
    loadParamsFromStorage,
    updateStrictlyChanged,
    updateParamsArgString,
    updateCommandFromProps,
    props,
  ]);

  const resetParamKey = useCallback(
    (paramKey) => {
      if (!paramKey) {
        return undefined;
      }
      const originals = paramOriginals || {};
      const orig = Object.prototype.hasOwnProperty.call(originals, paramKey)
        ? originals[paramKey]
        : getParamValue(paramKey);

      setEditedParameters((prev) => {
        const next = { ...(prev || {}) };
        if (typeof orig === 'undefined') {
          delete next[paramKey];
        } else {
          next[paramKey] = orig;
        }
        return next;
      });
      setParamEdits((prev) => {
        const next = { ...(prev || {}) };
        if (typeof orig === 'undefined') {
          delete next[paramKey];
        } else {
          next[paramKey] = orig;
        }
        return next;
      });
      setParams((prev) => {
        const next = { ...(prev || {}) };
        if (typeof orig === 'undefined') {
          delete next[paramKey];
        } else {
          next[paramKey] = orig;
        }
        return next;
      });

      updateStrictlyChanged();
      updateParamsArgString();
      saveParamsToStorageDebounced();
      return orig;
    },
    [
      paramOriginals,
      getParamValue,
      updateStrictlyChanged,
      updateParamsArgString,
      saveParamsToStorageDebounced,
    ]
  );

  const updateEditedParam = useCallback(
    (paramKey, value) => {
      if (!paramKey) {
        return;
      }
      setEditedParameters((prev) => ({
        ...(prev || {}),
        [paramKey]: value,
      }));
      setParamEdits((prev) => ({ ...(prev || {}), [paramKey]: value }));
      setParams((prev) => ({ ...(prev || {}), [paramKey]: value }));
      updateStrictlyChanged();
      updateParamsArgString();
      updateCommandFromProps();
      saveParamsToStorageDebounced();
    },
    [
      updateStrictlyChanged,
      updateParamsArgString,
      updateCommandFromProps,
      props,
      saveParamsToStorageDebounced,
    ]
  );

  const saveParamYaml = useCallback(() => {
    if (selectedParamKey) {
      ensureOriginalsFor(selectedParamKey);
    }
    const parsed = parseYamlishValue(yamlText);
    updateEditedParam(selectedParamKey, parsed);
    showToast('Parameter updated');
  }, [
    selectedParamKey,
    yamlText,
    ensureOriginalsFor,
    parseYamlishValue,
    updateEditedParam,
    showToast,
  ]);

  const resetParamYaml = useCallback(() => {
    if (!selectedParamKey) {
      return;
    }
    const orig = resetParamKey(selectedParamKey);
    const origYaml = toYamlString(orig);
    setYamlText(origYaml);
    setMetaEditText(origYaml);
    updateCommandFromProps();
    showToast('Reset to original');
  }, [
    selectedParamKey,
    resetParamKey,
    toYamlString,
    updateCommandFromProps,
    props,
    showToast,
  ]);

  // --- Watch list persistence/helpers ---
  const loadWatchFromStorage = useCallback(() => {
    let watchListData = [];
    let customOrderData = { param: false, dataset: false };
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
    try {
      const orderRaw = window.localStorage.getItem(
        RUNNER_WATCH_CUSTOM_ORDER_STORAGE_KEY
      );
      if (orderRaw) {
        const parsed = JSON.parse(orderRaw);
        if (parsed && typeof parsed === 'object') {
          customOrderData = {
            param: !!parsed.param,
            dataset: !!parsed.dataset,
          };
        }
      }
    } catch {}
    return { watchList: watchListData, customOrder: customOrderData };
  }, []);

  const hydrateWatchFromStorage = useCallback(() => {
    const { watchList: storedWatchList, customOrder: storedCustomOrder } =
      loadWatchFromStorage();
    if ((storedWatchList || []).length) {
      setWatchList(storedWatchList);
      try {
        const keys = (storedWatchList || [])
          .filter((i) => i.kind === 'param')
          .map((i) => i.id);
        ensureOriginalsFor(keys);
      } catch {}
    }
    if (storedCustomOrder) {
      setCustomOrder(storedCustomOrder);
    }
  }, [loadWatchFromStorage, ensureOriginalsFor]);

  const clearWatchList = useCallback(() => {
    const keys = (watchList || [])
      .filter((i) => i.kind === 'param')
      .map((i) => i.id);
    keys.forEach((k) => removeParamFromWatchList(k));
    setWatchList((prev) => (prev || []).filter((i) => i.kind !== 'dataset'));
    saveWatchToStorageDebounced();
    updateCommandFromProps();
  }, [
    watchList,
    removeParamFromWatchList,
    saveWatchToStorageDebounced,
    updateCommandFromProps,
    props,
  ]);

  // --- Watch modal and DnD ---
  const openWatchModal = useCallback(() => {
    const selected = {};
    const tempSelections = {};
    (watchList || []).forEach((item) => {
      selected[`${item.kind}:${item.id}`] = true;
      tempSelections[item.id] = {
        kind: item.kind,
        id: item.id,
        name: item.name || item.id,
      };
    });
    setIsWatchModalOpen(true);
    setSelectedToAdd(selected);
    setTempModalSelections(tempSelections);
    setWatchSearch('');
  }, [watchList]);

  const closeWatchModal = useCallback(() => {
    setIsWatchModalOpen(false);
    setTempModalSelections({});
  }, []);

  const toggleSelectToAdd = useCallback((kind, id) => {
    const key = `${kind}:${id}`;
    setSelectedToAdd((prev) => {
      const next = { ...(prev || {}) };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  }, []);

  const handleSearchToggle = useCallback(
    (kind, id, name) => {
      toggleSelectToAdd(kind, id);
      setTempModalSelections((prev) => {
        const next = { ...(prev || {}) };
        if (next[id]) {
          delete next[id];
        } else {
          next[id] = { kind, id, name: name || id };
        }
        return next;
      });
    },
    [toggleSelectToAdd]
  );

  const handleSearchChange = useCallback((e) => {
    setWatchSearch(e.target.value);
  }, []);

  const getSearchResults = useCallback(() => {
    const query = (watchSearch || '').trim().toLowerCase();
    const makeMatch = (text) =>
      text && String(text).toLowerCase().includes(query);

    const paramResults = (props.paramNodes || [])
      .map((node) => ({
        kind: 'param',
        id: node.id,
        name: node.name || node.id,
      }))
      .filter((item) => !query || makeMatch(item.id) || makeMatch(item.name))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );

    const datasetResults = (props.datasets || [])
      .map((dataset) => ({
        kind: 'dataset',
        id: dataset.id,
        name: dataset.name || dataset.id,
      }))
      .filter((item) => !query || makeMatch(item.id) || makeMatch(item.name))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );

    return { paramResults, datasetResults };
  }, [watchSearch, props]);

  const [draggingWatch, setDraggingWatch] = useState(null);

  const startDragWatch = useCallback((kind, id) => {
    setDraggingWatch({ kind, id });
  }, []);

  const allowDropWatch = useCallback((e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
  }, []);

  const dropWatch = useCallback(
    (targetKind, targetId) => {
      if (
        !draggingWatch ||
        draggingWatch.kind !== targetKind ||
        draggingWatch.id === targetId
      ) {
        setDraggingWatch(null);
        return;
      }
      setWatchList((prev) => {
        const list = [...(prev || [])];
        const kind = targetKind;
        const kindItems = list.filter((item) => item.kind === kind);
        const fromIndex = kindItems.findIndex(
          (item) => item.id === draggingWatch.id
        );
        const toIndex = kindItems.findIndex((item) => item.id === targetId);
        if (fromIndex === -1 || toIndex === -1) {
          setDraggingWatch(null);
          return prev;
        }
        const reordered = [...kindItems];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        let i = 0;
        const nextList = list.map((item) =>
          item.kind === kind ? reordered[i++] : item
        );
        const nextCustom = { ...(customOrder || {}), [kind]: true };
        setCustomOrder(nextCustom);
        saveWatchToStorageDebounced(nextList, nextCustom);
        setDraggingWatch(null);
        return nextList;
      });
    },
    [draggingWatch, customOrder, saveWatchToStorageDebounced]
  );

  // --- Jobs: persistence and polling ---
  const sanitizeJobForStorage = useCallback((job) => {
    const maxLogLength = 50000;
    const safeLogs =
      typeof job.logs === 'string' ? job.logs.slice(-maxLogLength) : '';
    const stored = {
      jobId: job.jobId,
      status: job.status,
      startedAt: job.startedAt || Date.now(),
      command: job.command || 'kedro run',
      logs: safeLogs,
    };
    if (typeof job.returncode === 'number') {
      stored.returncode = job.returncode;
    }
    if (typeof job.endTime === 'number') {
      stored.endTime = job.endTime;
    }
    if (typeof job.duration !== 'undefined') {
      stored.duration = job.duration;
    }
    return stored;
  }, []);

  const saveJobsToStorage = useCallback(
    (list) => {
      try {
        const payload = (list || []).map(sanitizeJobForStorage);
        window.localStorage.setItem(
          RUNNER_JOBS_STORAGE_KEY,
          JSON.stringify(payload)
        );
      } catch {}
    },
    [sanitizeJobForStorage]
  );

  const loadJobsFromStorage = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(RUNNER_JOBS_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((j) => ({
        jobId: j.jobId,
        status: j.status || 'unknown',
        startedAt: j.startedAt || Date.now(),
        command: j.command || 'kedro run',
        logs: typeof j.logs === 'string' ? j.logs : '',
        returncode: typeof j.returncode === 'number' ? j.returncode : undefined,
        endTime: typeof j.endTime === 'number' ? j.endTime : undefined,
        duration: typeof j.duration !== 'undefined' ? j.duration : undefined,
      }));
    } catch {
      return [];
    }
  }, []);

  const addOrUpdateJob = useCallback(
    (partial) => {
      if (!partial?.jobId) {
        return;
      }
      setJobs((prev) => {
        const list = [...(prev || [])];
        const idx = list.findIndex((j) => j.jobId === partial.jobId);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...partial };
        } else {
          list.unshift({
            jobId: partial.jobId,
            status: partial.status || 'initialize',
            startedAt: partial.startedAt || Date.now(),
            command:
              partial.command || commandInputRef.current?.value || 'kedro run',
            logs: partial.logs || '',
          });
        }
        // persist async
        setTimeout(() => saveJobsToStorage(list), 0);
        return list;
      });
    },
    [commandInputRef, saveJobsToStorage]
  );

  const fetchJobStatus = useCallback(
    async (jobId) => {
      try {
        const {
          status,
          stdout,
          stderr,
          returncode,
          startTime,
          endTime,
          duration,
          cmd,
        } = await getKedroCommandStatus(jobId);
        const update = {
          jobId,
          status,
          returncode,
          command: cmd,
        };
        if (startTime instanceof Date && !Number.isNaN(startTime.getTime())) {
          update.startedAt = startTime.getTime();
        }
        if (endTime instanceof Date && !Number.isNaN(endTime.getTime())) {
          update.endTime = endTime.getTime();
        }
        if (typeof duration !== 'undefined') {
          update.duration = duration;
        }
        if (typeof stdout === 'string' || typeof stderr === 'string') {
          update.logs = `${stdout || ''}${
            stderr ? `\n[stderr]:\n${stderr}` : ''
          }`;
        }
        addOrUpdateJob(update);
        const isTerminal = ['finished', 'terminated', 'error'].includes(status);
        const hasFinalReturnCode = typeof returncode === 'number';
        if (isTerminal || hasFinalReturnCode) {
          const pollTimer = jobPollers.current[jobId];
          if (pollTimer) {
            clearInterval(pollTimer);
          }
          delete jobPollers.current[jobId];
        }
      } catch (err) {
        addOrUpdateJob({ jobId, status: 'error' });
        const pollTimer = jobPollers.current[jobId];
        if (pollTimer) {
          clearInterval(pollTimer);
        }
        delete jobPollers.current[jobId];
        // eslint-disable-next-line no-console
        console.error('Failed to fetch job status', err);
      }
    },
    [addOrUpdateJob]
  );

  const startJobPolling = useCallback(
    (jobId) => {
      if (!jobId) {
        return;
      }
      if (jobPollers.current[jobId]) {
        clearInterval(jobPollers.current[jobId]);
      }
      jobPollers.current[jobId] = setInterval(() => {
        fetchJobStatus(jobId);
      }, 1000);
    },
    [fetchJobStatus]
  );

  const stopJobPolling = useCallback((jobId) => {
    const timerId = jobPollers.current[jobId];
    if (timerId) {
      clearInterval(timerId);
      delete jobPollers.current[jobId];
    }
  }, []);

  const hydrateJobsFromStorage = useCallback(() => {
    const stored = loadJobsFromStorage();
    if (!stored.length) {
      return;
    }
    setJobs(stored);
    stored.forEach((job) => {
      const isTerminal = ['finished', 'terminated', 'error'].includes(
        job.status
      );
      const hasFinalReturnCode = typeof job.returncode === 'number';
      if (
        (job.status === 'initialize' || job.status === 'running') &&
        !isTerminal &&
        !hasFinalReturnCode
      ) {
        startJobPolling(job.jobId);
      }
    });
  }, [loadJobsFromStorage, startJobPolling]);

  // --- Jobs UI helpers ---
  const toggleLogExpanded = useCallback((jobId) => {
    setExpandedLogs((prev) => {
      const next = { ...(prev || {}) };
      next[jobId] = !next[jobId];
      return next;
    });
  }, []);

  const openLogsModal = useCallback((jobId) => {
    setIsLogsModalOpen(true);
    setLogsModalJobId(jobId);
  }, []);

  const closeLogsModal = useCallback(() => {
    setIsLogsModalOpen(false);
    setLogsModalJobId(null);
  }, []);

  const setLogExpanded = useCallback((jobId, value) => {
    setExpandedLogs((prev) => ({
      ...(prev || {}),
      [jobId]: !!value,
    }));
  }, []);

  const openClearJobsConfirm = useCallback(() => {
    setIsClearJobsModalOpen(true);
  }, []);
  const closeClearJobsConfirm = useCallback(() => {
    setIsClearJobsModalOpen(false);
  }, []);

  const clearAllJobs = useCallback(() => {
    (jobs || []).forEach((j) => stopJobPolling(j.jobId));
    setJobs([]);
    saveJobsToStorage([]);
    closeClearJobsConfirm();
  }, [jobs, stopJobPolling, saveJobsToStorage, closeClearJobsConfirm]);

  const openClearJobConfirm = useCallback((jobId) => {
    setIsClearJobModalOpen(true);
    setClearJobModalJobId(jobId);
  }, []);

  const closeClearJobConfirm = useCallback(() => {
    setIsClearJobModalOpen(false);
    setClearJobModalJobId(null);
  }, []);

  const clearJob = useCallback(
    (jobId) => {
      const id = jobId || clearJobModalJobId;
      if (!id) {
        return;
      }
      stopJobPolling(id);
      setJobs((prev) => {
        const next = (prev || []).filter((j) => j.jobId !== id);
        saveJobsToStorage(next);
        return next;
      });
      closeClearJobConfirm();
    },
    [
      clearJobModalJobId,
      stopJobPolling,
      saveJobsToStorage,
      closeClearJobConfirm,
    ]
  );

  const onTerminateJob = useCallback(
    (jobId) => {
      // eslint-disable-next-line no-console
      console.log('[Runner] Terminate job', jobId);
      cancelKedroCommand(jobId)
        .then(() => {
          stopJobPolling(jobId);
          addOrUpdateJob({ jobId, status: 'terminated' });
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Terminate failed', err);
        });
    },
    [stopJobPolling, addOrUpdateJob]
  );

  // --- Metadata editors ---
  const closeMetadata = useCallback(() => {
    setShowMetadata(false);
    setMetadataMode(null);
    setSelectedParamKey(null);
    setSelectedDataset(null);
    setYamlText('');
  }, []);

  const openParamsDialog = useCallback(() => {
    try {
      const paramItems = (watchList || []).filter((i) => i.kind === 'param');
      const keys = paramItems.map((i) => i.id);
      ensureOriginalsFor(keys);
      const changedKeys = Object.keys(strictlyChanged || {}).filter((k) =>
        keys.includes(k)
      );
      const initial = changedKeys[0] || keys[0] || null;
      setIsParamsModalOpen(true);
      setParamsDialogSelectedKey(initial);
    } catch {
      setIsParamsModalOpen(true);
    }
  }, [watchList, ensureOriginalsFor, strictlyChanged]);

  const setSidInUrl = useCallback((nodeId) => {
    if (!nodeId) {
      return;
    }
    try {
      const current = new URL(window.location.href);
      current.searchParams.set('sid', nodeId);
      current.searchParams.delete('sn');
      const nextUrl = `${current.pathname}?${current.searchParams.toString()}`;
      window.history.pushState({}, '', nextUrl);
      lastSid.current = nodeId;
    } catch {}
  }, []);

  const openDatasetDetails = useCallback((dataset) => {
    setShowMetadata(true);
    setMetadataMode('dataset');
    setSelectedDataset(dataset);
  }, []);

  const openParamEditor = useCallback(
    (paramKey) => {
      ensureOriginalsFor(paramKey);
      let value = Object.prototype.hasOwnProperty.call(
        editedParameters || {},
        paramKey
      )
        ? editedParameters[paramKey]
        : getParamValue(paramKey);
      try {
        if (
          typeof value === 'function' ||
          (typeof value === 'object' &&
            value !== null &&
            Object.getPrototypeOf(value) !== Object.prototype &&
            !Array.isArray(value))
        ) {
          value = '';
        }
      } catch {
        value = '';
      }
      if (props.dispatch) {
        props.dispatch(loadNodeData(paramKey));
        props.dispatch(toggleNodeClicked(paramKey));
      }
      const text = toYamlString(value) || '';
      setShowMetadata(true);
      setMetadataMode('param');
      setSelectedParamKey(paramKey);
      setYamlText(text);
      setMetaEditText(text);
      setEditedParameters((prev) =>
        Object.prototype.hasOwnProperty.call(prev || {}, paramKey)
          ? prev
          : { ...(prev || {}), [paramKey]: value }
      );
      setSidInUrl(paramKey);
    },
    [
      ensureOriginalsFor,
      editedParameters,
      getParamValue,
      props,
      toYamlString,
      setSidInUrl,
    ]
  );

  // Process any deferred sid (from initial URL) after editors are defined
  useEffect(() => {
    const sid = pendingSid.current;
    if (!sid || sid === lastSid.current) {
      return;
    }
    // Attempt to find param node first
    const paramNode = (paramNodes || []).find((node) => node.id === sid);
    if (paramNode) {
      lastSid.current = sid;
      if (dispatch) {
        dispatch(loadNodeData(sid));
        dispatch(toggleNodeClicked(sid));
      }
      try {
        openParamEditor(sid);
      } catch (e) {
        /* ignore */
      }
      pendingSid.current = null;
      return;
    }
    const datasetNode = (datasets || []).find((node) => node.id === sid);
    if (datasetNode) {
      lastSid.current = sid;
      if (dispatch) {
        dispatch(loadNodeData(sid));
        dispatch(toggleNodeClicked(sid));
      }
      try {
        openDatasetDetails(datasetNode);
      } catch (e) {
        /* ignore */
      }
      pendingSid.current = null;
    }
  }, [paramNodes, datasets, openParamEditor, openDatasetDetails, dispatch]);

  const onStartRun = useCallback(() => {
    const command = commandInputRef.current
      ? commandInputRef.current.value
      : getCurrentCommandString();
    // eslint-disable-next-line no-console
    console.log('[Runner] Start run clicked', command);
    startKedroCommand(command)
      .then(({ jobId, status }) => {
        if (!jobId) {
          throw new Error('No job_id returned');
        }
        addOrUpdateJob({
          jobId,
          status,
          startedAt: Date.now(),
          command,
          logs: '',
        });
        startJobPolling(jobId);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to start run', err);
      });
  }, [
    commandInputRef,
    getCurrentCommandString,
    addOrUpdateJob,
    startJobPolling,
  ]);

  const onWatchItemClick = useCallback(
    (item) => {
      if (item.kind === 'param') {
        setSidInUrl(item.id);
        if (props.dispatch) {
          props.dispatch(loadNodeData(item.id));
          props.dispatch(toggleNodeClicked(item.id));
        }
        try {
          openParamEditor(item.id);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to open parameter editor for', item.id, e);
          showToast('Error opening parameter editor');
        }
      } else if (item.kind === 'dataset') {
        setSidInUrl(item.id);
        if (props.dispatch) {
          props.dispatch(loadNodeData(item.id));
          props.dispatch(toggleNodeClicked(item.id));
        }
        const dataset = (props.datasets || []).find(
          (datasetItem) => datasetItem.id === item.id
        );
        if (dataset) {
          openDatasetDetails(dataset);
        }
      }
    },
    [props, setSidInUrl, openParamEditor, showToast, openDatasetDetails]
  );

  // Removed unused addParamToWatchList (was unused and triggered lint warning)

  const removeFromWatchList = useCallback(
    (kind, id) => {
      if (kind === 'param') {
        removeParamFromWatchList(id);
        return;
      }
      setWatchList((prev) =>
        (prev || []).filter((item) => !(item.kind === kind && item.id === id))
      );
      saveWatchToStorageDebounced();
    },
    [removeParamFromWatchList, saveWatchToStorageDebounced]
  );

  const renderHighlightedYamlLines = useCallback((text, otherText) => {
    const a = String(text == null ? '' : text).split(/\r?\n/);
    const b = String(otherText == null ? '' : otherText).split(/\r?\n/);
    const max = Math.max(a.length, b.length);
    const highlightStyle = {
      background: 'var(--runner-hover-bg)',
      borderLeft: '2px solid var(--parameter-accent)',
      paddingLeft: '6px',
      marginLeft: '-6px',
    };
    return Array.from({ length: max }).map((_, i) => {
      const line = a[i] ?? '';
      const changed = (a[i] ?? '') !== (b[i] ?? '');
      return (
        <div key={i} style={changed ? highlightStyle : undefined}>
          {line || ' '}
        </div>
      );
    });
  }, []);

  // --- Render helpers (converted from class) ---
  const renderMetadataPanel = () => {
    if (!showMetadata) {
      return null;
    }
    if (metadataMode === 'param') {
      const extra = (
        <div style={{ margin: '0 36px 24px' }}>
          <h3
            className="pipeline-metadata__title pipeline-metadata__title--small"
            style={{ margin: '0 0 8px' }}
          >
            Edit parameters
          </h3>
          <textarea
            className="runner-meta-editor"
            value={metaEditText}
            onChange={onMetaEditChange}
            spellCheck={false}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="btn btn--primary" onClick={onMetaEditSave}>
              Save
            </button>
            <button className="btn" onClick={onMetaEditReset}>
              Reset
            </button>
          </div>
        </div>
      );
      return <MetaData extraComponent={extra} />;
    }
    if (metadataMode === 'dataset' && selectedDataset) {
      return <MetaData />;
    }
    return null;
  };

  const renderJobListPanel = () => (
    <JobListPanel
      jobs={jobs}
      expandedLogs={expandedLogs}
      onToggleLogExpanded={toggleLogExpanded}
      onOpenLogsModal={openLogsModal}
      onOpenClearJobConfirm={openClearJobConfirm}
      onOpenClearJobsConfirm={openClearJobsConfirm}
      onTerminateJob={onTerminateJob}
      logRefs={logRefs}
    />
  );

  const renderWatchListPanel = () => (
    <WatchPanel
      watchList={watchList}
      watchTab={watchTab}
      customOrder={customOrder}
      strictlyChanged={strictlyChanged}
      setWatchTab={setWatchTab}
      onDragStart={startDragWatch}
      onDragOver={allowDropWatch}
      onDrop={dropWatch}
      onItemClick={onWatchItemClick}
      onRemove={removeFromWatchList}
      getEditedParamValue={getEditedParamValue}
      toYamlString={toYamlString}
    />
  );

  const renderWatchModal = () => {
    const tempSelectedMap = Object.keys(tempModalSelections || {}).reduce(
      (acc, id) => {
        acc[id] = true;
        return acc;
      },
      {}
    );
    const { paramResults, datasetResults } = getSearchResults();
    return (
      <WatchListDialog
        isOpen={isWatchModalOpen}
        onClose={closeWatchModal}
        onConfirm={confirmAddSelected}
        onFlowchartNodeClick={(nodeId) =>
          onFlowchartNodeClickImpl({
            nodeId,
            paramNodes: props.paramNodes || [],
            datasets: props.datasets || [],
            dispatch: props.dispatch,
            toggleSelectToAdd,
          })
        }
        onFlowchartNodeDoubleClick={(node) =>
          onFlowchartNodeDoubleClickImpl({
            node,
            paramNodes: props.paramNodes || [],
            datasets: props.datasets || [],
            toggleSelectToAdd,
            setTempModalSelections: (updater) =>
              setTempModalSelections((prev) =>
                typeof updater === 'function' ? updater(prev) : updater
              ),
          })
        }
        tempSelectedMap={tempSelectedMap}
        stagedItems={tempModalSelections}
        watchSearch={watchSearch}
        onWatchSearchChange={setWatchSearch}
        paramResults={paramResults}
        datasetResults={datasetResults}
      />
    );
  };

  // --- Main render ---
  const hasParamChanges = !!Object.keys(strictlyChanged || {}).length;
  const containerClass = classnames('runner-manager', {
    'runner-manager--with-sidebar': props.displaySidebar,
    'runner-manager--sidebar-open':
      props.displaySidebar && props.sidebarVisible,
    'runner-manager--no-global-toolbar': !props.displayGlobalNavigation,
  });

  // Generic confirmation modal renderer (lightweight, self-contained)
  function renderConfirmationModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
  }) {
    if (!isOpen) {
      return null;
    }
    return (
      <div
        className="runner-logs-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Clear job confirmation"
      >
        <div className="runner-logs-modal__content">
          <div className="runner-logs-modal__header">
            <h3 className="runner-logs-modal__title">{title}</h3>
            <button
              className="runner-logs-modal__close"
              aria-label="Close"
              onClick={onCancel}
            >
              ×
            </button>
          </div>
          <div className="runner-logs-modal__body">
            <p>{message}</p>
          </div>
          <div className="runner-logs-modal__footer">
            <button className="btn" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button className="btn btn--danger" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderLogsModal({
    title = 'Job logs',
    logMessage,
    confirmLabel = 'Close',
    onClose = closeLogsModal,
  }) {
    if (!isLogsModalOpen) {
      return null;
    }
    return (
      <div
        className="runner-logs-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Job logs dialog"
      >
        <div className="runner-logs-modal__content">
          <div className="runner-logs-modal__header">
            <h3 className="runner-logs-modal__title">{title}</h3>
            <button
              className="runner-logs-modal__close"
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="runner-logs-modal__body">
            <pre>{logMessage || 'No logs available.'}</pre>
          </div>
          <div className="runner-logs-modal__footer">
            <button className="btn" onClick={onClose}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <header className="runner-manager__header">
        <h2 className="page-title">Runner</h2>
      </header>

      <main className="runner-manager__main">
        <ControlPanel
          currentCommand={getCurrentCommandString()}
          onStartRun={onStartRun}
          commandInputRef={commandInputRef}
          onCopyCommand={copyCommandToClipboard}
          hasParamChanges={hasParamChanges}
          activePipeline={props.activePipeline || PIPELINE.DEFAULT}
          selectedTags={props.selectedTags || []}
          onOpenParamsDialog={openParamsDialog}
          isParamsModalOpen={isParamsModalOpen}
          onCloseParamsModal={() => setIsParamsModalOpen(false)}
          paramItems={(watchList || []).filter((i) => i.kind === 'param')}
          paramsDialogSelectedKey={paramsDialogSelectedKey}
          onSelectParamKey={setParamsDialogSelectedKey}
          paramOriginals={paramOriginals}
          getParamValue={getParamValue}
          getEditedParamValue={getEditedParamValue}
          normalizeParamPrefix={normalizeParamPrefix}
          collectParamDiffs={collectParamDiffs}
          toYamlString={toYamlString}
          renderHighlightedYamlLines={renderHighlightedYamlLines}
          quoteIfNeeded={quoteIfNeeded}
          paramsArgString={paramsArgString}
          kedroEnv={kedroEnv}
        />

        <section className="runner-manager__jobs-panel" ref={jobsPanelRef}>
          {renderJobListPanel()}
        </section>

        <section className="runner-manager__editor">
          <div className="editor__header">
            <h3 className="section-title">Watch list</h3>
            <div className="editor__actions">
              <button className="btn btn--secondary" onClick={openWatchModal}>
                Add
              </button>
              <button
                className="btn btn--secondary"
                onClick={clearWatchList}
                disabled={!(watchList || []).length}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="runner-data-panel">{renderWatchListPanel()}</div>
        </section>
      </main>

      <footer className="runner-manager__footer">
        <small>
          UI draft — not wired to backend. Connect API endpoints for parameters,
          datasets and runs to make it live.
        </small>
      </footer>

      {renderMetadataPanel()}
      {renderWatchModal()}
      {toastVisible && (
        <div
          className="runner-toast"
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '16px',
            background: 'var(--color-bg-alt)',
            color: 'var(--color-text-alt)',
            padding: '10px 12px',
            borderRadius: '6px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
            zIndex: 9999,
            maxWidth: '50vw',
          }}
          onClick={hideToast}
        >
          {toastMessage || 'Saved'}
        </div>
      )}
      {renderConfirmationModal({
        isOpen: isClearJobsModalOpen,
        title: 'Clear all jobs',
        message:
          'This will remove all jobs from the list (running jobs will have polling stopped). Continue?',
        confirmLabel: 'Yes, clear all',
        cancelLabel: 'Cancel',
        onConfirm: clearAllJobs,
        onCancel: closeClearJobsConfirm,
      })}
      {renderConfirmationModal({
        isOpen: isClearJobModalOpen,
        title: 'Clear job',
        message:
          'Remove this job from the list? (If running, polling will stop.)',
        confirmLabel: 'Yes, clear job',
        cancelLabel: 'Cancel',
        onConfirm: () => clearJob(clearJobModalJobId),
        onCancel: closeClearJobConfirm,
      })}
      {renderLogsModal({
        title: `Job logs - ${logsModalJobId || ''}`,
        logMessage:
          (jobs || []).find((j) => j.jobId === logsModalJobId)?.logs || '',
        onClose: closeLogsModal,
      })}
    </div>
  );
}

const mapStateToProps = (state) => ({
  displaySidebar: state.display.sidebar,
  sidebarVisible: state.visible.sidebar,
  displayGlobalNavigation: state.display.globalNavigation,
  datasets: getVisibleNodes(state).filter((node) => node.type === 'data'),
  paramNodes: getVisibleNodes(state).filter(
    (node) => node.type === 'parameters'
  ),
  nodeParameters: state.node?.parameters || {},
  clickedNodeMetaData: getClickedNodeMetaData(state),
  activePipeline: state.pipeline.active,
  selectedTags: getTagData(state)
    .filter((tag) => tag.enabled)
    .map((tag) => tag.id),
});

export default connect(mapStateToProps)(KedroRunManager);
