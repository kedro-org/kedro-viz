import { useState, useRef, useEffect, useCallback } from 'react';
import JobListPanel from './jobs-panel';
import useJobs from './job-manager/useJobs';
import useWatchList from './watch-list-manager/useWatchList';
import classnames from 'classnames';
import { connect } from 'react-redux';
import '../metadata/styles/metadata.scss';
import MetaData from '../metadata/metadata';
import ParamMetadataEditor from './metadata/ParamMetadataEditor';
import ControlPanel from './control-panel';
import WatchPanel from './watch-panel/watch-panel';
import WatchListDialog from './watch-list-dialog/watch-list-dialog';
import { getVisibleNodes } from '../../selectors/nodes';
import { getTagData } from '../../selectors/tags';
import './runner-manager.scss';
import { startKedroCommand } from '../../utils/runner-api';
import useCommandBuilder from './command-builder/useCommandBuilder';
import { toggleNodeClicked, loadNodeData } from '../../actions/nodes';
import useRunnerUrlSelection from './hooks/useRunnerUrlSelection';
import { getClickedNodeMetaData } from '../../selectors/metadata';

function KedroRunManager(props) {
  if (process.env.NODE_ENV !== 'production') {
    console.assert(typeof WatchPanel === 'function', 'WatchPanel import not a function:', WatchPanel);
  }

  const { jobs, logRefs, clearJob, terminateJob, addJob } = useJobs();
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

  const { currentSid, syncFromUrl, setSidInUrl, removeSidFromUrl } = useRunnerUrlSelection();

  const [kedroEnvOverride, setKedroEnvOverride] = useState(null);
  const toastTimer = useRef();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Unified selection state: { id, kind, data? }
  const [selectedEntity, setSelectedEntity] = useState(null);
  const activeParamKey = selectedEntity?.kind === 'param' ? selectedEntity.id : null;
  const selectedDataset = selectedEntity?.kind === 'dataset' ? selectedEntity.data : null;
  const showMetadata = !!selectedEntity;
  const metadataMode = selectedEntity?.kind || null;
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);

  const { paramNodes = [], datasets = [], dispatch } = props || {};

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

  useEffect(() => {
    if (props?.kedroEnv) setKedroEnvOverride(props.kedroEnv);
  }, [props?.kedroEnv]);

  useEffect(() => {
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [syncFromUrl]);

  const showToast = useCallback((message, duration = 2000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(String(message || ''));
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), Math.max(0, duration));
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = null;
    setToastVisible(false);
  }, []);

  const openParamEditor = useCallback((paramKey) => {
    if (!paramKey) return;
    try {
      const searchParam = new URLSearchParams(window.location.search || '');
      if (searchParam.get('sid') !== paramKey) setSidInUrl(paramKey);
    } catch {
      setSidInUrl(paramKey);
    }
  }, [setSidInUrl]);

  const closeParamEditor = useCallback(() => {
    removeSidFromUrl();
  }, [removeSidFromUrl]);

  const onClickWatchItem = useCallback((item) => {
    try {
      setSidInUrl(item.id);
    } catch (e) {
      console.error('Failed selecting', item.id, e);
      showToast?.('Selection error');
    }
  }, [setSidInUrl, showToast]);

  const onRemoveFromWatchList = useCallback((itemId) => {
    const isClose = watchList.length <= 1 || selectedEntity?.id === itemId;
    removeFromWatchList(itemId);
    if (isClose) closeParamEditor();
  }, [watchList, selectedEntity, removeFromWatchList, closeParamEditor]);

  const onRemoveAllFromWatchList = useCallback(() => {
    clearWatchList();
    closeParamEditor();
  }, [clearWatchList, closeParamEditor]);

  const openWatchModal = useCallback(() => setIsWatchModalOpen(true), [watchList]);
  const closeWatchModal = useCallback(() => setIsWatchModalOpen(false), []);
  const confirmAddSelected = useCallback((newWatchList) => {
    updateWatchList(newWatchList);
    setIsWatchModalOpen(false);
  }, [updateWatchList]);

  useEffect(() => {
    if (!currentSid) {
      setSelectedEntity(null);
      return;
    }
    const sid = currentSid;
    const paramNode = (paramNodes || []).find((n) => n.id === sid);
    if (paramNode) {
      if (dispatch) {
        dispatch(loadNodeData(sid));
        dispatch(toggleNodeClicked(sid));
      }
      setSelectedEntity({ id: sid, kind: 'param' });
      return;
    }
    const datasetNode = (datasets || []).find((n) => n.id === sid);
    if (datasetNode) {
      if (dispatch) {
        dispatch(loadNodeData(sid));
        dispatch(toggleNodeClicked(sid));
      }
      setSelectedEntity({ id: sid, kind: 'dataset', data: datasetNode });
      return;
    }
    setSelectedEntity(null);
  }, [currentSid, paramNodes, datasets, dispatch]);

  const onStartRun = useCallback(() => {
    const command = commandBuilder.commandString;
    console.log('[Runner] Start run clicked', command);
    startKedroCommand(command)
      .then(({ jobId, status }) => {
        if (!jobId) throw new Error('No job_id returned');
        addJob({ jobId, status, startedAt: Date.now(), command, logs: '' });
      })
      .catch((err) => console.error('Failed to start run', err));
  }, [commandBuilder.commandString, addJob]);

  const renderControlPanel = () => (
    <ControlPanel commandBuilder={commandBuilder} onStartRun={onStartRun} />
  );

  const renderMetadataPanel = () => {
    if (!showMetadata) return null;
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
    if (metadataMode === 'dataset' && selectedDataset) return <MetaData />;
    return null;
  };

  const renderWatchModal = () => (
    !isWatchModalOpen ? null : (
      <WatchListDialog
        watchList={watchList}
        props={props}
        onClose={closeWatchModal}
        onConfirm={confirmAddSelected}
      />
    )
  );

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
        onAdd={openWatchModal}
      />
    );
  };

  const renderToast = () => (
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

  const containerClass = classnames('runner-manager', {
    'runner-manager--with-sidebar': props.displaySidebar,
    'runner-manager--sidebar-open': props.displaySidebar && props.sidebarVisible,
    'runner-manager--no-global-toolbar': !props.displayGlobalNavigation,
  });

  return (
    <div className={containerClass}>
      <header className="runner-manager__header">
        <h2 className="page-title">Runner</h2>
      </header>
      <main className="runner-manager__main">
        <section className="runner-manager__control-panel">{renderControlPanel()}</section>
        <section className="runner-manager__jobs-panel">{renderJobListPanel()}</section>
        <section className="runner-manager__editor">{renderWatchListPanel()}</section>
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
  datasets: getVisibleNodes(state).filter((n) => n.type === 'data'),
  paramNodes: getVisibleNodes(state).filter((n) => n.type === 'parameters'),
  nodeParameters: state.node?.parameters || {},
  clickedNodeMetaData: getClickedNodeMetaData(state),
  activePipeline: state.pipeline.active,
  selectedTags: getTagData(state).filter((t) => t.enabled).map((t) => t.id),
});

export default connect(mapStateToProps)(KedroRunManager);
