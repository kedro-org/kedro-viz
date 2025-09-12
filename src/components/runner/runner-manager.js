import { useState, useRef, useEffect, useCallback } from 'react';
import JobListPanel from './JobListPanel';
import useJobs from './job-manager/useJobs';
import useWatchList from './watch-list-manager/useWatchList';
import classnames from 'classnames';
import { connect } from 'react-redux';
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
import { getClickedNodeMetaData } from '../../selectors/metadata';
import { useGeneratePathname } from '../../utils/hooks/use-generate-pathname';

function KedroRunManager(props) {
  const { jobs, logRefs, clearJob, terminateJob, addJob } = useJobs();
  const {
    watchList,
    hydrated: isWatchListHydrated,
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

  // State
  const [kedroEnvOverride, setKedroEnvOverride] = useState(null); // optional external override

  // Toast and transient UI state
  const toastTimer = useRef();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);

  const {
    paramNodes = [],
    datasets = [],
    dispatch,
    clickedNodeMetaData,
  } = props || {};

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

  const { toSelectedNode, toSelectedPipeline } = useGeneratePathname();

  useEffect(() => {
    if (props?.kedroEnv) {
      setKedroEnvOverride(props.kedroEnv);
    }
  }, [props?.kedroEnv]);

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
    }
    toastTimer.current = null;
    setToastVisible(false);
  }, []);

  const closeParamEditor = useCallback(() => {
    dispatch && dispatch(toggleNodeClicked(null));
    toSelectedPipeline();
  }, [dispatch, toggleNodeClicked]);

  const onClickWatchItem = useCallback(
    (item) => {
      try {
        if (dispatch) {
          dispatch(loadNodeData(item.id));
          dispatch(toggleNodeClicked(item.id));
        }
        toSelectedNode({ id: item.id });
      } catch (e) {
        console.error('Failed selecting', item.id, e);
        if (showToast) {
          showToast('Selection error');
        }
      }
    },
    [showToast, toSelectedNode, dispatch, loadNodeData, toggleNodeClicked]
  );

  const onRemoveFromWatchList = useCallback(
    (itemId) => {
      const isClose =
        watchList.length <= 1 || clickedNodeMetaData?.id === itemId;
      removeFromWatchList(itemId);
      if (isClose) {
        closeParamEditor();
      }
    },
    [watchList, removeFromWatchList, closeParamEditor, clickedNodeMetaData]
  );

  const onRemoveAllFromWatchList = useCallback(() => {
    clearWatchList();
    closeParamEditor();
  }, [clearWatchList, closeParamEditor]);

  const onWatchItemAdd = useCallback(() => {
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

  const renderControlPanel = () => (
    <ControlPanel commandBuilder={commandBuilder} onStartRun={onStartRun} />
  );

  const renderMetadataPanel = () => {
    if (
      !isWatchListHydrated ||
      !clickedNodeMetaData ||
      !clickedNodeMetaData.type
    ) {
      return null;
    }

    const itemId = clickedNodeMetaData.id;
    const isInWatchList = (watchList || []).some((item) => item.id === itemId);

    let extra = null;
    if (clickedNodeMetaData.type === 'parameters' && isInWatchList) {
      extra = (
        <ParamMetadataEditor
          key={itemId}
          paramValue={getParamValueFromKey(itemId)}
          onSave={(val) => editParamInEditor(itemId, val)}
          onReset={() => resetParamInEditor(itemId)}
          showToast={showToast}
        />
      );
    }
    return <MetaData extraComponent={extra} />;
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
    if (!isWatchListHydrated) {
      return (
        <div className="watch-panel watch-panel--loading">
          <small>Loading watch list…</small>
        </div>
      );
    }

    if (!Array.isArray(watchList)) {
      console.warn('[RunnerManager] watchList not array', watchList);
      return null;
    }

    if (!watchList) {
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
