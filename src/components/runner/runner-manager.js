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
import WatchPanel from './watch-panel';
import WatchListDialog from './watch-list-dialog';
import { getVisibleNodes } from '../../selectors/nodes';
import { getTagData } from '../../selectors/tags';
import './runner-manager.scss';
import { startKedroCommand } from '../../utils/runner-api';
import { PIPELINE } from '../../config';
import useCommandBuilder from './command-builder/useCommandBuilder';
import { toggleNodeClicked, loadNodeData } from '../../actions/nodes';
import { getClickedNodeMetaData } from '../../selectors/metadata';

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
  getParamValueFromKey,
    toYamlString,
    parseYamlishValue,
  ensureOriginalsFor,
    // exposed helpers
    getParamValue,
    saveParamsToStorageDebounced,
  } = useWatchList(props);

  // State
  const [kedroEnvOverride, setKedroEnvOverride] = useState(null); // optional external override
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

  // Destructure frequently used props to satisfy exhaustive-deps and avoid adding entire props object
  const { paramNodes = [], datasets = [], dispatch } = props || {};

  // --- Command builder hook ---
  const {
    kedroEnv: kedroEnvDerived,
    commandString,
  paramsArgString,
  quoteIfNeeded,
  collectParamDiffs,
  normalizeParamPrefix,
  } = useCommandBuilder({
    activePipeline: props?.activePipeline,
    selectedTags: props?.selectedTags,
    kedroEnv: props?.kedroEnv || kedroEnvOverride,
    watchList,
    paramOriginals,
    paramEdits,
    getParamValue,
    getParamValueFromKey,
  });

  // Mirror env (if user wants to adjust via UI later)
  useEffect(() => {
    if (props?.kedroEnv) {
      setKedroEnvOverride(props.kedroEnv);
    }
  }, [props?.kedroEnv]);

  // Keep command input ref updated
  const updateCommandFromProps = useCallback(() => {
    const cmd = commandString;
    if (commandInputRef?.current && commandInputRef.current.value !== cmd) {
      commandInputRef.current.value = cmd;
    }
  }, [commandString]);

  // Fetch kedro environment info from backend
  // (fetching handled inside useCommandBuilder when not provided)

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
  updateCommandFromProps(); // initial
  // paramsArgString now derived inside useCommandBuilder
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
  }, [props.activePipeline, props.selectedTags, kedroEnvDerived, watchList, commandString]);

  // Visual components used by run manager (stays here for now)
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

  // --- Metadata editor handlers --- (Move to metadata parameter editor UI)
  const onMetaEditChange = (e) => setMetaEditText(e.target.value);
  const onMetaEditSave = () => {
    setYamlText(metaEditText || '');
    saveParamYaml();
  };
  const onMetaEditReset = () => resetParamYaml();

  // Control panel helpers (Move to control panel component)
  const getCurrentCommandString = useCallback(() => commandString, [commandString]);

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
      updateCommandFromProps();
  saveParamsToStorageDebounced();
    },
  [editParamInEditor, saveParamsToStorageDebounced, updateCommandFromProps]
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
    showToast,
  ]);

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
    setIsWatchModalOpen(true);
  }, [watchList]);

  const closeWatchModal = useCallback(() => {
    setIsWatchModalOpen(false);
  }, []);

  const confirmAddSelected = useCallback(
    (newWatchList) => {
      updateWatchList(newWatchList);
      setIsWatchModalOpen(false);
    },
    [updateWatchList]
  );

  const openParamEditor = useCallback(
    (paramKey) => {
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

  const onWatchItemClick = useCallback(
    (item) => {
      if (item.kind === 'param') {
        if (props.dispatch) {
          props.dispatch(loadNodeData(item.id));
          props.dispatch(toggleNodeClicked(item.id));
        }
        try {
          openParamEditor(item.id);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to open parameter editor for', item.id, e);

          if (showToast) {
            showToast('Error opening parameter editor');
          }
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

  const renderWatchModal = () => {
    if (!isWatchModalOpen) {
      return null;
    }
    return (
      <WatchListDialog
        watchList={watchList}
        props={props}
        onClose={closeWatchModal}
        onConfirm={confirmAddSelected}
      />
    );
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
      strictlyChanged={strictlyChanged}
      getEditedParamValue={getParamValueFromKey}
      toYamlString={toYamlString}
      onWatchItemClick={onWatchItemClick}
      removeFromWatchList={removeFromWatchList}
    />
  );


  const renderWatchListDeveloper = () => (
    <details
      className="runner-data-panel__developer"
      style={{ margin: '12px 0' }}
    >
      <summary
        style={{
          cursor: 'pointer',
          padding: '8px 12px',
          fontWeight: 600,
          listStyle: 'none',
        }}
      >
        Developer view (toggle)
      </summary>

      <div
        style={{
          maxHeight: '240px',
          overflow: 'auto',
          padding: '8px 12px',
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <strong>Watch List</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(watchList, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Param Originals</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(paramOriginals, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Param Edits</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(paramEdits, null, 2)}
          </pre>
        </div>
      </div>
    </details>
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
          getEditedParamValue={getParamValueFromKey}
          normalizeParamPrefix={normalizeParamPrefix}
          collectParamDiffs={collectParamDiffs}
          toYamlString={toYamlString}
          renderHighlightedYamlLines={renderHighlightedYamlLines}
          quoteIfNeeded={quoteIfNeeded}
          paramsArgString={paramsArgString}
          kedroEnv={kedroEnvDerived}
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

      {renderWatchListDeveloper()}
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
