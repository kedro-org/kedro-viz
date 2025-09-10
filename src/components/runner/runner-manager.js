import { useState, useRef, useEffect, useCallback } from 'react';
import JobListPanel from './JobListPanel';
import useJobs from './job-manager/useJobs';
import useWatchList from './watch-list-manager/useWatchList';
import classnames from 'classnames';
import { connect } from 'react-redux';
// Reuse existing metadata panel styles
import '../metadata/styles/metadata.scss';
import MetaData from '../metadata/metadata';
import ParamMetadataEditor from './metadata/ParamMetadataEditor';
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
    paramOriginals,
    paramEdits,
    resetParamInEditor,
    editParamInEditor,
    getParamValueFromKey,
    toYamlString,
    parseYamlishValue,
    getBaseParamValue,
  } = useWatchList(props);

  // State
  const [kedroEnvOverride, setKedroEnvOverride] = useState(null); // optional external override

  // Toast and transient UI state
  const toastTimer = useRef();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  // Metadata panel state
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [paramsDialogSelectedKey, setParamsDialogSelectedKey] = useState(null); // for dialog
  const [activeParamKey, setActiveParamKey] = useState(null); // for metadata editor
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
    diffModel,
  } = useCommandBuilder({
    activePipeline: props?.activePipeline,
    selectedTags: props?.selectedTags,
    kedroEnv: props?.kedroEnv || kedroEnvOverride,
    watchList,
    paramOriginals,
    paramEdits,
    getBaseParamValue,
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
  }, [
    props.activePipeline,
    props.selectedTags,
    kedroEnvDerived,
    watchList,
    commandString,
  ]);

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

  // Control panel helpers (Move to control panel component)
  const getCurrentCommandString = useCallback(
    () => commandString,
    [commandString]
  );

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
    const paramItems = (watchList || []).filter((i) => i.kind === 'param');
    const keys = paramItems.map((i) => i.id);
    const changedKeys = Object.keys(strictlyChanged || {}).filter((k) =>
      keys.includes(k)
    );
    const initial = changedKeys[0] || keys[0] || null;
    setIsParamsModalOpen(true);
    setParamsDialogSelectedKey(initial);
  }, [watchList, strictlyChanged]);

  // Parameter editing helpers adapted from legacy implementation
  // Legacy reset/edit YAML handlers removed (handled centrally by parameter editor hook now)

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

  const removeSidFromUrl = useCallback(() => {
    try {
      const current = new URL(window.location.href);
      current.searchParams.delete('sid');
      const nextUrl = `${current.pathname}?${current.searchParams.toString()}`;
      window.history.pushState({}, '', nextUrl);
      lastSid.current = null;
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
      if (!paramKey) {
        return;
      }
      if (props.dispatch) {
        props.dispatch(loadNodeData(paramKey));
        props.dispatch(toggleNodeClicked(paramKey));
      }
      setActiveParamKey(paramKey);
      setShowMetadata(true);
      setMetadataMode('param');
      setSidInUrl(paramKey);
    },
    [props, paramOriginals, getBaseParamValue, toYamlString, setSidInUrl]
  );

  const closeParamEditor = useCallback(() => {
    setActiveParamKey(null);
    setShowMetadata(false);
    // setMetadataMode(null);
    removeSidFromUrl();
  }, []);

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

  // --- Render helpers (converted from class) ---
  const renderMetadataPanel = () => {
    if (!showMetadata) {
      return null;
    }
    if (metadataMode === 'param' && activeParamKey) {
      const extra = (
        <ParamMetadataEditor
          key={activeParamKey}
          paramValue={getParamValueFromKey(activeParamKey)}
          toYamlString={toYamlString}
          parseYamlishValue={parseYamlishValue}
          onSave={(val) => editParamInEditor(activeParamKey, val)}
          onReset={() => resetParamInEditor(activeParamKey)}
          showToast={showToast}
        />
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
      removeFromWatchList={(itemId) => {
        const isClose = watchList.length <= 1 || itemId === activeParamKey;
        removeFromWatchList(itemId);
        if (isClose) {
          closeParamEditor();
        }
      }}
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
        <div>
          <strong>Parameter Value</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(getParamValueFromKey(activeParamKey), null, 2)}
          </pre>
        </div>

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

  const renderToast = () => {
    return (
      toastVisible && (
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
      )
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
          paramsDialogSelectedKey={paramsDialogSelectedKey}
          onSelectParamKey={setParamsDialogSelectedKey}
          toYamlString={toYamlString}
          renderHighlightedYamlLines={renderHighlightedYamlLines}
          paramsArgString={paramsArgString}
          kedroEnv={kedroEnvDerived}
          diffModel={diffModel}
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
                onClick={() => {
                  clearWatchList();
                  closeParamEditor();
                }}
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
        <small>UI draft — not all features implemented.</small>
      </footer>
      {renderWatchListDeveloper()}
      {renderMetadataPanel()}
      {renderWatchModal()}
      {renderToast()}
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
