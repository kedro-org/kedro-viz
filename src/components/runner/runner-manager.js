import { useState, useRef, useEffect, useCallback } from 'react';
import JobListPanel from './JobListPanel';
import useJobs from './job-manager/useJobs';
import useWatchList from './watch-list-manager/useWatchList';
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
import { startKedroCommand, fetchKedroEnv } from '../../utils/runner-api';
import { PIPELINE } from '../../config';
import { toggleNodeClicked, loadNodeData } from '../../actions/nodes';
import { getClickedNodeMetaData } from '../../selectors/metadata';

// // Keys for persisting Watch list and custom order
// const RUNNER_WATCHLIST_STORAGE_KEY = 'kedro_viz_runner_watch_list';
// const RUNNER_WATCH_CUSTOM_ORDER_STORAGE_KEY =
//   'kedro_viz_runner_watch_custom_order';
// // Keys for persisting parameter edits and originals
// const RUNNER_PARAM_EDITS_STORAGE_KEY = 'kedro_viz_runner_param_edits';
// const RUNNER_PARAM_ORIGINALS_STORAGE_KEY = 'kedro_viz_runner_param_originals';

/**
 * KedroRunManager
 * A visual draft page for starting and monitoring Kedro runs.
 * No functional wiring — purely presentational scaffolding you can hook up later.
 */

function KedroRunManager(props) {
  // Refs
  const commandInputRef = useRef();
  const jobsPanelRef = useRef();
  const lastSid = useRef();
  const pendingSid = useRef(null);

  const { jobs, logRefs, clearJob, terminateJob, addJob } = useJobs();

  const {
    // Direct watch list interactions
    watchList,
    strictlyChanged,
    addToWatchList,
    removeFromWatchList,
    updateWatchList,
    clearWatchList,
    saveWatchToStorageDebounced,
    
    // Parameter editor interactions
    paramOriginals,
    paramEdits,
    resetParamInEditor,
    editParamInEditor,
  getEditedParamValue,
  normalizeParamPrefix,
  collectParamDiffs,
  toYamlString,
  parseYamlishValue,
  paramsArgString,
  updateParamsArgString,
  ensureOriginalsFor,
  // exposed helpers
  getParamValue,
  saveParamsToStorageDebounced,

  } = useWatchList(props);

  // State
  const [kedroEnv, setKedroEnv] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [watchTab, setWatchTab] = useState('parameters');
  // Toast and transient UI state
  const toastTimer = useRef();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Metadata / parameter editor UI state
  const [metaEditText, setMetaEditText] = useState('');
  const [yamlText, setYamlText] = useState('');
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [paramsDialogSelectedKey, setParamsDialogSelectedKey] = useState(null);
  const [params, setParams] = useState({});
  const [editedParameters, setEditedParameters] = useState({});
  const [selectedParamKey, setSelectedParamKey] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadataMode, setMetadataMode] = useState(null);
  // Watch modal state
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [tempModalSelections, setTempModalSelections] = useState({});
  const [watchSearch, setWatchSearch] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState({});

  // Destructure frequently used props to satisfy exhaustive-deps and avoid adding entire props object
  const { paramNodes = [], datasets = [], dispatch } = props || {};

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

  // --- Lifecycle: componentDidMount, componentWillUnmount, componentDidUpdate ---
  useEffect(() => {
  fetchAndSetKedroEnv();
  updateCommandFromProps();
  updateParamsArgString();
  syncMetadataFromSid();
    window.addEventListener('popstate', syncMetadataFromSid);
    return () => {
      window.removeEventListener('popstate', syncMetadataFromSid);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // componentDidUpdate logic for prop/state changes
  useEffect(() => {
    // pipeline/tags/env changes
    updateCommandFromProps();
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

  // // --- Parameter helpers/persistence ---
  // const toYamlString = useCallback((value) => {
  //   try {
  //     return yamlStringify(value, { indent: 2, lineWidth: 0 });
  //   } catch {
  //     return String(value);
  //   }
  // }, []);

  // const parseYamlishValue = useCallback((text) => {
  //   if (text == null) {
  //     return '';
  //   }
  //   const str = String(text);
  //   if (!str.trim()) {
  //     return '';
  //   }
  //   try {
  //     return yamlParse(str);
  //   } catch {
  //     try {
  //       return JSON.parse(str);
  //     } catch {
  //       return str;
  //     }
  //   }
  // }, []);


  // // --- Watch modal and DnD ---
  // const openWatchModal = useCallback(() => {
  //   const selected = {};
  //   const tempSelections = {};
  //   (watchList || []).forEach((item) => {
  //     selected[`${item.kind}:${item.id}`] = true;
  //     tempSelections[item.id] = {
  //       kind: item.kind,
  //       id: item.id,
  //       name: item.name || item.id,
  //     };
  //   });
  //   setIsWatchModalOpen(true);
  //   setSelectedToAdd(selected);
  //   setTempModalSelections(tempSelections);
  //   setWatchSearch('');
  // }, [watchList]);

  // const closeWatchModal = useCallback(() => {
  //   setIsWatchModalOpen(false);
  //   setTempModalSelections({});
  // }, []);


  // const handleSearchToggle = useCallback(
  //   (kind, id, name) => {
  //     toggleSelectToAdd(kind, id);
  //     setTempModalSelections((prev) => {
  //       const next = { ...(prev || {}) };
  //       if (next[id]) {
  //         delete next[id];
  //       } else {
  //         next[id] = { kind, id, name: name || id };
  //       }
  //       return next;
  //     });
  //   },
  //   [toggleSelectToAdd]
  // );

  // const handleSearchChange = useCallback((e) => {
  //   setWatchSearch(e.target.value);
  // }, []);

  // // --- Metadata editors ---
  // const closeMetadata = useCallback(() => {
  //   setShowMetadata(false);
  //   setMetadataMode(null);
  //   setSelectedParamKey(null);
  //   setSelectedDataset(null);
  //   setYamlText('');
  // }, []);

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

  // Toast helpers
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

  // Parameter editing helpers adapted from legacy implementation
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
      setParams((prev) => {
        const next = { ...(prev || {}) };
        if (typeof orig === 'undefined') {
          delete next[paramKey];
        } else {
          next[paramKey] = orig;
        }
        return next;
      });

      try {
        editParamInEditor(paramKey, orig);
      } catch {}

      updateParamsArgString();
      saveParamsToStorageDebounced();
      return orig;
    },
    [
      paramOriginals,
      getParamValue,
      editParamInEditor,
      saveParamsToStorageDebounced,
      updateParamsArgString,
    ]
  );

  const updateEditedParam = useCallback(
    (paramKey, value) => {
      if (!paramKey) {
        return;
      }
      setEditedParameters((prev) => ({ ...(prev || {}), [paramKey]: value }));
      setParams((prev) => ({ ...(prev || {}), [paramKey]: value }));
      try {
        editParamInEditor(paramKey, value);
      } catch {}
      updateParamsArgString();
      updateCommandFromProps();
      saveParamsToStorageDebounced();
    },
    [editParamInEditor, updateParamsArgString, saveParamsToStorageDebounced]
  );

  const saveParamYaml = useCallback(() => {
    if (!selectedParamKey) {
      return;
    }
    try {
      ensureOriginalsFor(selectedParamKey);
    } catch {}
    const parsed = parseYamlishValue(yamlText);
    updateEditedParam(selectedParamKey, parsed);
    showToast('Parameter updated');
  }, [selectedParamKey, yamlText, ensureOriginalsFor, parseYamlishValue, updateEditedParam, showToast]);

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
  }, [selectedParamKey, resetParamKey, toYamlString, updateCommandFromProps, showToast]);

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

  const toggleSelectToAdd = useCallback((kind, id, name) => {
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
    setTempModalSelections((prev) => {
      const next = { ...(prev || {}) };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = { kind, id, name: name || id };
      }
      return next;
    });
  }, []);

  const confirmAddSelected = useCallback(() => {
    const stagedValues = Object.values(tempModalSelections || {});
    // Replace watchList with staged selections
    updateWatchList(stagedValues);
    // Ensure parameters are registered in editor
    stagedValues
      .filter((i) => i.kind === 'param')
      .forEach((param) => {
        try {
          addToWatchList(param);
        } catch (e) {}
      });
    saveWatchToStorageDebounced(stagedValues, null);
    setIsWatchModalOpen(false);
  }, [tempModalSelections, updateWatchList, addToWatchList, saveWatchToStorageDebounced]);

  const renderWatchModal = () => {
    const tempSelectedMap = Object.keys(tempModalSelections || {}).reduce(
      (acc, id) => {
        acc[id] = true;
        return acc;
      },
      {}
    );
    return (
      <WatchListDialog
        isOpen={isWatchModalOpen}
        onClose={closeWatchModal}
        onConfirm={confirmAddSelected}
        onFlowchartNodeClick={(nodeId) =>
          onFlowchartNodeClickImpl({
            nodeId,
            paramNodes: paramNodes || [],
            datasets: datasets || [],
            dispatch: dispatch,
            toggleSelectToAdd: toggleSelectToAdd,
          })
        }
        onFlowchartNodeDoubleClick={(node) =>
          onFlowchartNodeDoubleClickImpl({
            node,
            paramNodes: paramNodes || [],
            datasets: datasets || [],
            toggleSelectToAdd: toggleSelectToAdd,
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
        paramResults={[]}
        datasetResults={[]}
      />
    );
  };

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
      const text = toYamlString(value) || 'default text';
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
        addJob({
          jobId,
          status,
          startedAt: Date.now(),
          command,
          logs: '',
        });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to start run', err);
      });
  }, [commandInputRef, getCurrentCommandString, addJob]);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Render helpers (converted from class) ---
  const renderMetadataPanel = () => {
    if (!showMetadata || !mounted) {
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
      logRefs={logRefs}
      onRemoveJob={clearJob}
      onTerminateJob={terminateJob}
    />
  );

  const renderWatchListPanel = () => (
    <WatchPanel
      watchList={watchList}
      watchTab={watchTab}
      strictlyChanged={strictlyChanged}
      getEditedParamValue={getEditedParamValue}
      toYamlString={toYamlString}
      setSidInUrl={setSidInUrl}
      openParamEditor={openParamEditor}
      openDatasetDetails={openDatasetDetails}
      saveWatchToStorageDebounced={saveWatchToStorageDebounced}
      removeParamFromWatchList={removeFromWatchList}
      setWatchList={(updater) =>
        updateWatchList(typeof updater === 'function' ? updater(watchList) : updater)
      }
      props={props}
      setTempModalSelections={setTempModalSelections}
      setWatchSearch={setWatchSearch}
    />
  );


  // --- Main render ---
  const hasParamChanges = !!Object.keys(strictlyChanged || {}).length;
  const containerClass = classnames('runner-manager', {
    'runner-manager--with-sidebar': props.displaySidebar,
    'runner-manager--sidebar-open':
      props.displaySidebar && props.sidebarVisible,
    'runner-manager--no-global-toolbar': !props.displayGlobalNavigation,
  });

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
