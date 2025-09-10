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
import WatchPanel from './watch-panel/watch-panel';
import WatchListDialog from './watch-list-dialog';
import { getVisibleNodes } from '../../selectors/nodes';
import { getTagData } from '../../selectors/tags';
import './runner-manager.scss';
import { startKedroCommand } from '../../utils/runner-api';
import useCommandBuilder from './command-builder/useCommandBuilder';
import { toggleNodeClicked, loadNodeData } from '../../actions/nodes';
import useRunnerUrlSelection from './hooks/useRunnerUrlSelection';
import { getClickedNodeMetaData } from '../../selectors/metadata';

/**
 * KedroRunManager
 * A visual draft page for starting and monitoring Kedro runs.
 * No functional wiring — purely presentational scaffolding you can hook up later.
 */
function KedroRunManager(props) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.assert(
      typeof WatchPanel === 'function',
      'WatchPanel import not a function:',
      WatchPanel
    );
  }

  // Job management hook
  const { jobs, logRefs, clearJob, terminateJob, addJob } = useJobs();

  // Used for parameter and dataset interactions
  const {
    watchList,
    strictlyChanged,
    removeFromWatchList,
    updateWatchList,
    clearWatchList,
    paramOriginals,
    paramEdits,
    resetParamInEditor,
    editParamInEditor,
    getParamValueFromKey,
    getBaseParamValue,
  } = useWatchList(props);

  const {
    pendingSid,
    syncFromUrl,
    setSidInUrl,
    removeSidFromUrl,
    markSidProcessed,
  } = useRunnerUrlSelection();

  // State
  const [kedroEnvOverride, setKedroEnvOverride] = useState(null); // optional external override

  // Toast and transient UI state
  const toastTimer = useRef();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeParamKey, setActiveParamKey] = useState(null); // for metadata editor
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadataMode, setMetadataMode] = useState(null);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);

  // Destructure frequently used props to satisfy exhaustive-deps and avoid adding entire props object
  const { paramNodes = [], datasets = [], dispatch } = props || {};

  // --- Command builder hook ---
  const commandBuilder = useCommandBuilder({
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

  // Initialise on mount, cleanup on unmount
  useEffect(() => {
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, []);

  // Visual components used by run manager (stays here for now)
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
    [props, paramOriginals, getBaseParamValue, setSidInUrl]
  );

  const closeParamEditor = useCallback(() => {
    setActiveParamKey(null);
    setShowMetadata(false);
    removeSidFromUrl();
  }, []);

  const onClickWatchItem = useCallback(
    (item) => {
      if (item.kind === 'param') {
        if (props.dispatch) {
          props.dispatch(loadNodeData(item.id));
          props.dispatch(toggleNodeClicked(item.id));
        }
        try {
          openParamEditor(item.id);
        } catch (e) {
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

  const onRemoveFromWatchList = useCallback(
    (itemId) => {
      const isClose = watchList.length <= 1 || itemId === activeParamKey;
      removeFromWatchList(itemId);
      if (isClose) {
        closeParamEditor();
      }
    },
    [watchList, activeParamKey, removeFromWatchList, closeParamEditor]
  );

  const onRemoveAllFromWatchList = useCallback(() => {
    clearWatchList();
    closeParamEditor();
  }, [clearWatchList, closeParamEditor]);

  const onWatchItemAdd = useCallback(() => {
    openWatchModal();
  }, [openWatchModal]);

  // Process any deferred sid (from initial URL) after editors are defined
  // TODO: Fix this problematic code. The causes the page to crash when there is a a render
  useEffect(() => {
    const sid = pendingSid;
    if (!sid) {
      return;
    }
    const paramNode = (paramNodes || []).find((node) => node.id === sid);
    if (paramNode) {
      if (dispatch) {
        dispatch(loadNodeData(sid));
        dispatch(toggleNodeClicked(sid));
      }
      openParamEditor(sid);
      markSidProcessed();
      return;
    }
    const datasetNode = (datasets || []).find((node) => node.id === sid);
    if (datasetNode) {
      if (dispatch) {
        dispatch(loadNodeData(sid));
        dispatch(toggleNodeClicked(sid));
      }
      openDatasetDetails(datasetNode);
      markSidProcessed();
    }
  }, [
    pendingSid,
    paramNodes,
    datasets,
    openParamEditor,
    openDatasetDetails,
    dispatch,
    markSidProcessed,
  ]);

  const onStartRun = useCallback(() => {
    const command = commandBuilder.commandString;
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
        console.error('Failed to start run', err);
      });
  }, [commandBuilder.commandString, addJob]);

  // --- Render helpers (converted from class) ---
  const renderControlPanel = () => (
    <ControlPanel commandBuilder={commandBuilder} onStartRun={onStartRun} />
  );

  const renderMetadataPanel = () => {
    if (!showMetadata) {
      return null;
    }
    if (metadataMode === 'param' && activeParamKey) {
      const extra = (
        <ParamMetadataEditor
          key={activeParamKey}
          paramValue={getParamValueFromKey(activeParamKey)}
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

  const renderWatchListPanel = () => {
    if (!Array.isArray(watchList)) {
      console.warn('[RunnerManager] watchList not array', watchList);
      return null;
    }

    return (
      <WatchPanel
        watchList={watchList}
        strictlyChanged={strictlyChanged}
        getEditedParamValue={getParamValueFromKey}
        onClickItem={onClickWatchItem}
        onRemoveItem={onRemoveFromWatchList}
        onClear={onRemoveAllFromWatchList}
        onAdd={onWatchItemAdd}
      />
    );
  };

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
  // hasParamChanges now provided by commandBuilder
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
        <section className="runner-manager__control-panel">
          {renderControlPanel()}
        </section>

        <section className="runner-manager__jobs-panel">
          {renderJobListPanel()}
        </section>

        <section className="runner-manager__editor">
          {renderWatchListPanel()}
        </section>
      </main>

      <footer className="runner-manager__footer">
        <small>UI draft — not all features implemented.</small>
      </footer>

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
