import React, { Component } from 'react';
import { connect } from 'react-redux';
import Sidebar from '../sidebar';
// Reuse existing metadata panel styles
import '../metadata/styles/metadata.scss';
import MetaDataStats from '../metadata/metadata-stats';
import { getVisibleNodes } from '../../selectors/nodes';
import { getTagData } from '../../selectors/tags';
import './runner-manager.scss';
import { sanitizedPathname } from '../../utils';
import { PIPELINE } from '../../config';
import FlowChart from '../flowchart';
import WatchListDialog from './watch-list-dialog';
import { toggleNodeClicked } from '../../actions/nodes';

/**
 * KedroRunManager
 * A visual draft page for starting and monitoring Kedro runs.
 * No functional wiring — purely presentational scaffolding you can hook up later.
 */
class KedroRunManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // UI state for Data & Parameters panel
      activeTab: 'parameters', // 'parameters' | 'datasets'
      filterText: '',
      // Simple mock of parameters dictionary. Replace via API on mount.
      // API: GET `${basePath}/api/runner/parameters` -> setState({ params: response })
      params: {
        'model.learning_rate': 0.001,
        'model.dropout': 0.2,
        'etl.batch_size': 256,
        'etl.shuffle': true,
        'report.title': 'Weekly KPIs',
        'thresholds.alert': { precision: 0.8, recall: 0.7 },
      },
      expandedParams: {}, // key -> boolean
      // Right-side metadata panel state
      showMetadata: false,
      metadataMode: null, // 'param' | 'dataset'
      selectedParamKey: null,
      yamlText: '',
      selectedDataset: null,
      // Client-side jobs list (placeholder until API is wired)
      jobs: [],
      // Watch list state
      watchList: [],
      isWatchModalOpen: false,
      selectedToAdd: {}, // key `${kind}:${id}` -> true
      tempModalSelections: {}, // id -> { kind, name }
      watchSearch: '',
      // Watch list panel tab: 'parameters' | 'datasets'
      watchTab: 'parameters',
      // Drag state and custom order flags for watch list
      draggingWatch: null, // { kind, id }
      customOrder: { param: false, dataset: false },
    };

    // Ref for the command input field
    this.commandInputRef = React.createRef();
  }

  componentDidMount() {
    this.updateCommandFromProps(this.props);
  }

  componentDidUpdate(prevProps) {
    const pipelineChanged =
      prevProps.activePipeline !== this.props.activePipeline;
    const prevTags = (prevProps.selectedTags || []).slice().sort().join(',');
    const nextTags = (this.props.selectedTags || []).slice().sort().join(',');
    const tagsChanged = prevTags !== nextTags;
    if (pipelineChanged || tagsChanged) {
      this.updateCommandFromProps(this.props);
    }
  }

  quoteIfNeeded = (text) => {
    if (!text) {
      return '';
    }
    const str = String(text);
    return str.includes(' ') ? `"${str.replace(/"/g, '\\"')}"` : str;
  };

  buildRunCommand = (props) => {
    const activePipeline = props.activePipeline;
    const selectedTags = props.selectedTags || [];
    const parts = ['kedro run'];
    if (activePipeline && activePipeline !== PIPELINE.DEFAULT) {
      parts.push('-p');
      parts.push(this.quoteIfNeeded(activePipeline));
    }
    if (selectedTags.length) {
      const tagArg = selectedTags.join(',');
      parts.push('-t');
      parts.push(tagArg);
    }
    return parts.join(' ');
  };

  updateCommandFromProps = (props) => {
    const cmd = this.buildRunCommand(props);
    if (this.commandInputRef && this.commandInputRef.current) {
      if (this.commandInputRef.current.value !== cmd) {
        this.commandInputRef.current.value = cmd;
      }
    }
  };

  saveParamYaml = () => {
    const { selectedParamKey, yamlText } = this.state;
    // API wiring: Update parameter value on server
    // const apiBase = `${sanitizedPathname()}api/runner`;
    // fetch(`${apiBase}/parameters/${encodeURIComponent(selectedParamKey)}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'text/yaml' },
    //   body: yamlText,
    // })
    //   .then((res) => {
    //     if (!res.ok) throw new Error('Failed to save parameter');
    //   })
    //   .catch((err) => console.error('Save param failed', err));
    console.log('[Runner] Save parameter YAML', selectedParamKey, yamlText);
  };

  resetParamYaml = () => {
    const { selectedParamKey } = this.state;
    const value = this.state.params?.[selectedParamKey];
    this.setState({ yamlText: this.toYamlString(value) });
  };

  // Very lightweight YAML-ish stringifier for display-only purposes
  toYamlString(obj) {
    try {
      if (obj && typeof obj === 'object') {
        return Object.entries(obj)
          .map(
            ([key, value]) =>
              `${key}: ${
                typeof value === 'object' ? JSON.stringify(value) : value
              }`
          )
          .join('\n');
      }
      return String(obj);
    } catch (error) {
      return String(obj);
    }
  }

  // --- Dataset interactions ---
  openDatasetDetails = (dataset) => {
    // API: Optionally fetch more metadata here if needed
    // const apiBase = `${sanitizedPathname()}api/runner`;
    // fetch(`${apiBase}/datasets/${encodeURIComponent(dataset.id)}`).then((r) => r.json()).then((full) => this.setState({ selectedDataset: full }));
    this.setState({
      showMetadata: true,
      metadataMode: 'dataset',
      selectedDataset: dataset,
    });
  };

  onStartRun = () => {
    // Read the command string from the input
    const command = this.commandInputRef.current
      ? this.commandInputRef.current.value
      : 'kedro run';
    console.log('[Runner] Start run clicked', command);
    // API wiring: start a new run
    // const apiBase = `${sanitizedPathname()}api/runner`;
    // fetch(`${apiBase}/runs`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ command }),
    // })
    //   .then((r) => r.json())
    //   .then((job) => {
    //     // Add job immediately and begin polling/log streaming for it
    //     this.setState((s) => ({ jobs: [job, ...(s.jobs || [])] }));
    //   })
    //   .catch((err) => console.error('Failed to start run', err));

    // Local placeholder: create a client-side job entry with a generated ID
    const jobId = `job-${Date.now()}`;
    const newJob = {
      jobId,
      status: 'running',
      startedAt: Date.now(),
      command,
      logs: '[INFO] Starting Kedro...\n[INFO] Loading pipeline...\n[INFO] Running node: preprocess',
    };
    this.setState((prev) => ({ jobs: [newJob, ...(prev.jobs || [])] }));
  };

  onViewLogs = (jobId) => {
    console.log('[Runner] View logs for', jobId);
    // API wiring: load full logs for a given job (optionally with pagination)
    // const apiBase = `${sanitizedPathname()}api/runner`;
    // fetch(`${apiBase}/runs/${encodeURIComponent(jobId)}/logs?offset=0&limit=1000`)
    //   .then((r) => r.text())
    //   .then((text) => {/* show in a modal/panel */})
    //   .catch((err) => console.error('Load logs failed', err));
  };

  onTerminateJob = (jobId) => {
    console.log('[Runner] Terminate job', jobId);
    // API wiring: request termination for a running job
    // const apiBase = `${sanitizedPathname()}api/runner`;
    // fetch(`${apiBase}/runs/${encodeURIComponent(jobId)}`, { method: 'DELETE' })
    //   .then((res) => {
    //     if (!res.ok) throw new Error('Terminate failed');
    //     // Optionally update job status immediately
    //   })
    //   .catch((err) => console.error('Terminate failed', err));

    // Local placeholder: mark job as terminated
    this.setState((prev) => ({
      jobs: (prev.jobs || []).map((j) =>
        j.jobId === jobId ? { ...j, status: 'terminated' } : j
      ),
    }));
  };

  closeMetadata = () => {
    this.setState({
      showMetadata: false,
      metadataMode: null,
      selectedParamKey: null,
      selectedDataset: null,
      yamlText: '',
    });
  };

  renderMetadataPanel() {
    const {
      metadataMode,
      showMetadata,
      selectedParamKey,
      yamlText,
      selectedDataset,
    } = this.state;

    if (!showMetadata) {
      return null;
    }

    if (metadataMode === 'param') {
      return (
        <div
          className="pipeline-metadata kedro pipeline-metadata--visible"
          role="dialog"
          aria-label="Parameter editor"
        >
          <div className="pipeline-metadata__header-toolbox">
            <div className="pipeline-metadata__header">
              <h2 className="pipeline-metadata__title">Edit parameter</h2>
            </div>
            <button
              className="pipeline-metadata__close-button"
              onClick={this.closeMetadata}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="pipeline-metadata__list">
            <dl className="pipeline-metadata__properties">
              <dt className="pipeline-metadata__label">Key:</dt>
              <dd className="pipeline-metadata__row">
                <span className="pipeline-metadata__value">
                  {selectedParamKey}
                </span>
              </dd>
              <dt className="pipeline-metadata__label">YAML:</dt>
              <dd className="pipeline-metadata__row">
                <textarea
                  className="runner-yaml-editor"
                  value={yamlText}
                  onChange={(e) => this.setState({ yamlText: e.target.value })}
                  spellCheck={false}
                  rows={16}
                />
                <div className="runner-yaml-actions">
                  <button
                    className="btn btn--primary"
                    onClick={this.saveParamYaml}
                  >
                    Save
                  </button>
                  <button className="btn" onClick={this.resetParamYaml}>
                    Reset
                  </button>
                </div>
                {/* API: Save -> PUT to parameters endpoint; Reset -> refetch original value */}
              </dd>
            </dl>
          </div>
        </div>
      );
    }

    if (metadataMode === 'dataset' && selectedDataset) {
      const { name, fullName, type, icon, filepath, stats, datasetType } =
        selectedDataset;
      return (
        <div
          className="pipeline-metadata kedro pipeline-metadata--visible"
          role="dialog"
          aria-label="Dataset details"
        >
          <div className="pipeline-metadata__header-toolbox">
            <div className="pipeline-metadata__header">
              <h2 className="pipeline-metadata__title">{name}</h2>
            </div>
            <button
              className="pipeline-metadata__close-button"
              onClick={this.closeMetadata}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="pipeline-metadata__list">
            <dl className="pipeline-metadata__properties">
              <dt className="pipeline-metadata__label">Type:</dt>
              <dd className="pipeline-metadata__row">
                <span className="pipeline-metadata__value">dataset</span>
              </dd>
              <dt className="pipeline-metadata__label">Dataset Type:</dt>
              <dd className="pipeline-metadata__row">
                <span className="pipeline-metadata__value pipeline-metadata__value--kind-type">
                  {datasetType || type}
                </span>
              </dd>
              <dt className="pipeline-metadata__label">File Path:</dt>
              <dd className="pipeline-metadata__row">
                <span className="pipeline-metadata__value pipeline-metadata__value--kind-path">
                  {filepath || 'N/A'}
                </span>
              </dd>
              {stats && (
                <>
                  <span
                    className="pipeline-metadata__label"
                    data-label="Dataset statistics:"
                  >
                    Dataset statistics:
                  </span>
                  <MetaDataStats stats={stats} />
                </>
              )}
            </dl>
          </div>
        </div>
      );
    }

    return null;
  }

  renderParametersTab() {
    // Deprecated: replaced by Watch List UI
    return null;
  }

  renderDatasetsTab() {
    // Deprecated: replaced by Watch List UI
    return null;
  }

  // --- Watch list actions ---
  openWatchModal = () => {
    // Preselect previously selected items (existing watch list)
    const selected = {};
    const tempSelections = {};
    (this.state.watchList || []).forEach((item) => {
      selected[`${item.kind}:${item.id}`] = true;
      tempSelections[item.id] = {
        kind: item.kind,
        id: item.id,
        name: item.name || item.id,
      };
    });
    this.setState({
      isWatchModalOpen: true,
      selectedToAdd: selected,
      tempModalSelections: tempSelections,
      watchSearch: '',
    });
  };

  closeWatchModal = () => {
    this.setState({ isWatchModalOpen: false, tempModalSelections: {} });
  };

  toggleSelectToAdd = (kind, id) => {
    const key = `${kind}:${id}`;
    this.setState((prev) => {
      const next = { ...(prev.selectedToAdd || {}) };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return { selectedToAdd: next };
    });
  };

  // Toggle from search results
  handleSearchToggle = (kind, id, name) => {
    this.toggleSelectToAdd(kind, id);
    this.setState((prev) => {
      const next = { ...(prev.tempModalSelections || {}) };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = { kind, id, name: name || id };
      }
      return { tempModalSelections: next };
    });
  };

  handleSearchChange = (e) => {
    this.setState({ watchSearch: e.target.value });
  };

  getSearchResults() {
    const query = (this.state.watchSearch || '').trim().toLowerCase();
    const makeMatch = (text) =>
      text && String(text).toLowerCase().includes(query);
    const paramResults = (this.props.paramNodes || [])
      .map((node) => ({
        kind: 'param',
        id: node.id,
        name: node.name || node.id,
      }))
      .filter((item) => !query || makeMatch(item.id) || makeMatch(item.name))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
    const datasetResults = (this.props.datasets || [])
      .map((d) => ({ kind: 'dataset', id: d.id, name: d.name || d.id }))
      .filter((item) => !query || makeMatch(item.id) || makeMatch(item.name))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
    return { paramResults, datasetResults };
  }

  // --- Drag-and-drop reordering for watch list ---
  startDragWatch = (kind, id) => {
    this.setState({ draggingWatch: { kind, id } });
  };

  allowDropWatch = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
  };

  dropWatch = (targetKind, targetId) => {
    const { draggingWatch } = this.state;
    if (
      !draggingWatch ||
      draggingWatch.kind !== targetKind ||
      draggingWatch.id === targetId
    ) {
      this.setState({ draggingWatch: null });
      return;
    }
    this.setState((prev) => {
      const list = [...(prev.watchList || [])];
      const kind = targetKind;
      // Extract the sequence of items of this kind in their current order
      const kindItems = list.filter((item) => item.kind === kind);
      const fromIndex = kindItems.findIndex(
        (item) => item.id === draggingWatch.id
      );
      const toIndex = kindItems.findIndex((item) => item.id === targetId);
      if (fromIndex === -1 || toIndex === -1) {
        return { draggingWatch: null };
      }
      const reordered = [...kindItems];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      // Rebuild the full list: replace items of this kind in encounter order with reordered
      let i = 0;
      const nextList = list.map((item) =>
        item.kind === kind ? reordered[i++] : item
      );
      return {
        watchList: nextList,
        draggingWatch: null,
        customOrder: { ...(prev.customOrder || {}), [kind]: true },
      };
    });
  };

  confirmAddSelected = () => {
    const { selectedToAdd } = this.state;
    if (!selectedToAdd || !Object.keys(selectedToAdd).length) {
      this.closeWatchModal();
      return;
    }
    const items = Object.keys(selectedToAdd).map((key) => {
      const [kind, id] = key.split(':');
      if (kind === 'param') {
        return { kind, id, name: id };
      }
      const dataset = (this.props.datasets || []).find((d) => d.id === id);
      return { kind, id, name: dataset?.name || id };
    });
    this.setState((prev) => {
      const existingKeys = new Set(
        (prev.watchList || []).map((item) => `${item.kind}:${item.id}`)
      );
      const merged = [
        ...(prev.watchList || []),
        ...items.filter((item) => !existingKeys.has(`${item.kind}:${item.id}`)),
      ];
      return { watchList: merged, isWatchModalOpen: false, selectedToAdd: {} };
    });
  };

  clearWatchList = () => {
    this.setState({ watchList: [] });
  };

  removeFromWatchList = (kind, id) => {
    this.setState((prev) => ({
      watchList: (prev.watchList || []).filter(
        (item) => !(item.kind === kind && item.id === id)
      ),
    }));
  };

  onWatchItemClick = (item) => {
    if (item.kind === 'param') {
      this.openParamEditor(item.id);
    } else if (item.kind === 'dataset') {
      const dataset = (this.props.datasets || []).find(
        (datasetItem) => datasetItem.id === item.id
      );
      if (dataset) {
        this.openDatasetDetails(dataset);
      }
    }
  };

  // Handle flowchart node clicks inside the watch modal to toggle selection
  handleFlowchartNodeClick = (nodeId) => {
    // Find if clicked node is a dataset or parameter
    const isParam = (this.props.paramNodes || []).some(
      (paramNode) => paramNode.id === nodeId
    );
    const datasetItem = (this.props.datasets || []).find(
      (d) => d.id === nodeId
    );
    if (isParam) {
      this.toggleSelectToAdd('param', nodeId);
    } else if (datasetItem) {
      this.toggleSelectToAdd('dataset', datasetItem.id);
    }
    // Also toggle clicked highlight on the flowchart (single highlight)
    if (this.props.dispatch) {
      this.props.dispatch(toggleNodeClicked(nodeId));
    }
  };

  // Handle double-click to select and highlight green and stage into temp list
  handleFlowchartNodeDoubleClick = (node) => {
    const nodeId = node?.id;
    if (!nodeId) {
      return;
    }
    const isParam = (this.props.paramNodes || []).some(
      (paramNode) => paramNode.id === nodeId
    );
    let entry;
    if (isParam) {
      entry = { kind: 'param', id: nodeId, name: node.name || nodeId };
      this.toggleSelectToAdd('param', nodeId);
    } else {
      const datasetItem = (this.props.datasets || []).find(
        (d) => d.id === nodeId
      );
      if (!datasetItem) {
        return;
      }
      entry = {
        kind: 'dataset',
        id: datasetItem.id,
        name: datasetItem.name || datasetItem.id,
      };
      this.toggleSelectToAdd('dataset', datasetItem.id);
    }
    this.setState((prev) => {
      const next = { ...(prev.tempModalSelections || {}) };
      if (next[nodeId]) {
        delete next[nodeId];
      } else {
        next[nodeId] = entry;
      }
      return { tempModalSelections: next };
    });
  };

  renderWatchListPanel() {
    const { watchList, watchTab, customOrder } = this.state;
    const parameterItems = (watchList || []).filter(
      (watchItem) => watchItem.kind === 'param'
    );
    const datasetItems = (watchList || []).filter(
      (watchItem) => watchItem.kind === 'dataset'
    );
    let itemsToShow = watchTab === 'parameters' ? parameterItems : datasetItems;
    const kindKey = watchTab === 'parameters' ? 'param' : 'dataset';
    if (!customOrder[kindKey]) {
      itemsToShow = [...itemsToShow].sort((a, b) =>
        (a.name || a.id).localeCompare(b.name || b.id, undefined, {
          sensitivity: 'base',
        })
      );
    }
    const getParamPreview = (key) => {
      const value = this.state.params ? this.state.params[key] : undefined;
      if (typeof value === 'undefined') {
        return '—';
      }
      const text = this.toYamlString(value) || '';
      const firstLine = String(text).split(/\r?\n/)[0];
      return firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine;
    };
    return (
      <div className="runner-panel runner-panel--watchlist">
        <div className="runner-panel__toolbar">
          <div className="watchlist-actions">
            <button
              className="btn btn--secondary"
              onClick={this.openWatchModal}
            >
              Add to watch list
            </button>
            <button
              className="btn btn--danger"
              onClick={this.clearWatchList}
              disabled={!watchList.length}
            >
              Clear list
            </button>
          </div>
          <div className="runner-panel__tabs">
            <button
              className={`runner-tab ${
                watchTab === 'parameters' ? 'runner-tab--active' : ''
              }`}
              onClick={() => this.setState({ watchTab: 'parameters' })}
            >
              Parameters ({parameterItems.length})
            </button>
            <button
              className={`runner-tab ${
                watchTab === 'datasets' ? 'runner-tab--active' : ''
              }`}
              onClick={() => this.setState({ watchTab: 'datasets' })}
            >
              Datasets ({datasetItems.length})
            </button>
          </div>
        </div>
        <div
          className="runner-panel__list"
          role="region"
          aria-label="Watch list"
        >
          {!watchList.length && (
            <div className="watchlist-empty">No items in your watch list.</div>
          )}
          <ul className="watchlist-list">
            {itemsToShow.map((item) => (
              <li
                key={`${item.kind}:${item.id}`}
                className="watchlist-item"
                draggable
                onDragStart={() => this.startDragWatch(item.kind, item.id)}
                onDragOver={this.allowDropWatch}
                onDrop={() => this.dropWatch(item.kind, item.id)}
              >
                <button
                  className="watchlist-item__main"
                  onClick={() => this.onWatchItemClick(item)}
                >
                  <span className="watchlist-item__name">{item.name}</span>
                  {watchTab === 'parameters' && (
                    <span className="watchlist-item__preview">
                      {getParamPreview(item.id)}
                    </span>
                  )}
                </button>
                <button
                  className="watchlist-item__remove"
                  aria-label="Remove from watch list"
                  onClick={() => this.removeFromWatchList(item.kind, item.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  renderWatchModal() {
    const {
      isWatchModalOpen,
      tempModalSelections,
      watchSearch,
      selectedToAdd,
    } = this.state;
    const { paramResults, datasetResults } = this.getSearchResults();
    const tempSelectedMap = Object.keys(tempModalSelections || {}).reduce(
      (acc, id) => {
        acc[id] = true;
        return acc;
      },
      {}
    );
    const canConfirm =
      !!Object.keys(selectedToAdd || {}).length ||
      !!Object.keys(tempModalSelections || {}).length;

    return (
      <WatchListDialog
        isOpen={isWatchModalOpen}
        onClose={this.closeWatchModal}
        onConfirm={this.confirmAddSelected}
        onFlowchartNodeClick={this.handleFlowchartNodeClick}
        onFlowchartNodeDoubleClick={this.handleFlowchartNodeDoubleClick}
        tempSelectedMap={tempSelectedMap}
        stagedItems={tempModalSelections}
        watchSearch={watchSearch}
        onWatchSearchChange={(value) => this.setState({ watchSearch: value })}
        paramResults={paramResults}
        datasetResults={datasetResults}
        canConfirm={canConfirm}
      />
    );
  }

  render() {
    const { displaySidebar, sidebarVisible, displayGlobalNavigation } =
      this.props;

    const wrapperClassNames = [
      'runner-manager',
      displaySidebar ? 'runner-manager--with-sidebar' : null,
      displaySidebar && sidebarVisible ? 'runner-manager--sidebar-open' : null,
      !displayGlobalNavigation ? 'runner-manager--no-global-toolbar' : null,
      this.state.showMetadata ? 'runner-manager--metadata-open' : null,
    ]
      .filter(Boolean)
      .join(' ');

    const { activeTab } = this.state;

    return (
      <>
        {displaySidebar && <Sidebar disableMinimap />}
        <div className={wrapperClassNames}>
          <header className="runner-manager__header">
            <div className="runner-manager__title">
              <h2>Runner</h2>
              <p className="runner-manager__subtitle">
                Start, monitor and inspect pipeline runs
              </p>
            </div>
            <div className="runner-manager__overview">
              <div className="overview-item">
                <div className="overview-item__label">Active jobs</div>
                <div className="overview-item__value">
                  {
                    (this.state.jobs || []).filter(
                      (j) => j.status === 'running'
                    ).length
                  }
                </div>
              </div>
              <div className="overview-item">
                <div className="overview-item__label">Last run</div>
                <div className="overview-item__value">—</div>
              </div>
            </div>
          </header>

          <main className="runner-manager__main">
            <section className="runner-manager__control-panel">
              <h3 className="section-title">Run command</h3>
              <div className="runner-manager__control-body">
                <div className="control-row">
                  <label className="control-row__label">Command</label>
                  <input
                    className="control-row__input"
                    ref={this.commandInputRef}
                    defaultValue="kedro run"
                  />
                </div>
                {/* Additional controls/configuration can go here */}
              </div>
              <div className="runner-manager__control-footer">
                <div className="runner-manager__actions">
                  <button
                    className="btn btn--primary"
                    onClick={this.onStartRun}
                  >
                    Start run
                  </button>
                </div>

                <div className="runner-manager__hints">
                  <small>
                    Pro tip: use <code>kedro run -n</code> to run a single node.
                  </small>
                </div>
              </div>
            </section>

            <section className="runner-manager__jobs-panel">
              <h3 className="section-title">Jobs</h3>
              <div className="jobs-list">
                {(this.state.jobs || []).length === 0 && (
                  <div className="job-card">
                    <div className="job-card__meta">
                      <div className="job-card__id">No jobs</div>
                    </div>
                    <div className="job-card__body">
                      <div className="job-card__stdout">
                        <pre>Click "Start run" to create a job.</pre>
                      </div>
                    </div>
                  </div>
                )}

                {(this.state.jobs || []).map((job) => (
                  <article key={job.jobId} className="job-card">
                    <div className="job-card__meta">
                      <div className="job-card__id">{job.jobId}</div>
                      <div
                        className={`job-card__status ${
                          job.status === 'running'
                            ? 'job-card__status--running'
                            : 'job-card__status--error'
                        }`}
                      >
                        {job.status}
                      </div>
                      <div className="job-card__time">
                        started {new Date(job.startedAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="job-card__body">
                      <div className="job-card__stdout">
                        <pre>{job.logs}</pre>
                      </div>
                      <div className="job-card__controls">
                        <button
                          className="btn"
                          onClick={() => this.onViewLogs(job.jobId)}
                        >
                          View full logs
                        </button>
                        <button
                          className="btn btn--danger"
                          onClick={() => this.onTerminateJob(job.jobId)}
                        >
                          Terminate
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Editor replaced with Watch List */}
            <section className="runner-manager__editor">
              <h3 className="section-title">Watch list</h3>
              <div className="runner-data-panel">
                {this.renderWatchListPanel()}
              </div>
            </section>
          </main>

          <footer className="runner-manager__footer">
            <small>
              UI draft — not wired to backend. Connect API endpoints for
              parameters, datasets and runs to make it live.
            </small>
          </footer>

          {this.renderMetadataPanel()}
          {this.renderWatchModal()}
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  displaySidebar: state.display.sidebar,
  sidebarVisible: state.visible.sidebar,
  displayGlobalNavigation: state.display.globalNavigation,
  // Visible datasets from the current graph; we only need data nodes
  datasets: getVisibleNodes(state).filter((node) => node.type === 'data'),
  // Also expose parameter nodes for selection in the watch modal
  paramNodes: getVisibleNodes(state).filter(
    (node) => node.type === 'parameters'
  ),
  activePipeline: state.pipeline.active,
  // Only include enabled tags that are present in the active pipeline; use raw IDs
  selectedTags: getTagData(state)
    .filter((tag) => tag.enabled)
    .map((tag) => tag.id),
});

export default connect(mapStateToProps)(KedroRunManager);
