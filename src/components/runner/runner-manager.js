import React, { Component } from 'react';
import { connect } from 'react-redux';
import Sidebar from '../sidebar';
// Reuse existing metadata panel styles
import '../metadata/styles/metadata.scss';
import MetaDataStats from '../metadata/metadata-stats';
import NodeIcon from '../icons/node-icon';
import JSONObject from '../json-object';
import MetaData from '../metadata/metadata';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { getVisibleNodes } from '../../selectors/nodes';
import { getTagData } from '../../selectors/tags';
import './runner-manager.scss';
import { sanitizedPathname } from '../../utils';
import {
  startKedroCommand,
  getKedroCommandStatus,
  cancelKedroCommand,
} from '../../utils/runner-api';
import { PIPELINE } from '../../config';
import FlowChart from '../flowchart';
import WatchListDialog from './watch-list-dialog';
import { toggleNodeClicked, loadNodeData } from '../../actions/nodes';
import { getClickedNodeMetaData } from '../../selectors/metadata';

// Key for persisting runner jobs across page changes
const RUNNER_JOBS_STORAGE_KEY = 'kedro_viz_runner_jobs';
// Keys for persisting Watch list and custom order
const RUNNER_WATCHLIST_STORAGE_KEY = 'kedro_viz_runner_watch_list';
const RUNNER_WATCH_CUSTOM_ORDER_STORAGE_KEY =
  'kedro_viz_runner_watch_custom_order';

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
      // Logs UI state
      expandedLogs: {}, // jobId -> boolean (default true)
      isLogsModalOpen: false,
      logsModalJobId: null,
      // Parameter override state
      paramOriginals: {},
      paramEdits: {},
      isParamsModalOpen: false,
      // Aesthetic-only editor embedded at the bottom of MetaData
      metaEditText: '',
      // Store edits keyed by watched parameter id -> edited value
      editedParameters: {},
    };

    // Ref for the command input field
    this.commandInputRef = React.createRef();
    // Map of jobId -> intervalId for polling
    this.jobPollers = {};
    // Jobs panel ref to compute available height for expanded logs
    this.jobsPanelRef = React.createRef();
    // Jobs panel body ref to compute available height below sticky header
    this.jobsPanelBodyRef = React.createRef();
    // Refs to log containers per job for auto-scrolling
    this.logRefs = {};

    // Track last applied selected id from URL to avoid redundant work
    this._lastSid = null;
  }

  // --- Runner-only aesthetic editor (inside MetaData extra slot) ---
  onMetaEditChange = (e) => {
    this.setState({ metaEditText: e.target.value });
  };

  onMetaEditReset = () => {
    const { selectedParamKey } = this.state;
    if (!selectedParamKey) {
      this.setState({ metaEditText: '' });
      return;
    }
    const value = this.getParamValue(selectedParamKey);
    this.setState({ metaEditText: this.toYamlString(value) });
  };

  onMetaEditSave = () => {
    const { selectedParamKey, metaEditText } = this.state;
    if (!selectedParamKey) {
      return;
    }
    const parsed = this.parseYamlishValue(metaEditText);
    this.setState((prev) => ({
      editedParameters: {
        ...(prev.editedParameters || {}),
        [selectedParamKey]: parsed,
      },
    }));
  };

  componentDidMount() {
    // Rehydrate any persisted jobs and resume polling where needed
    this.hydrateJobsFromStorage();
    // Rehydrate persisted watch list and custom order
    this.hydrateWatchFromStorage();
    // Store original params snapshot for diffing
    try {
      this.setState({
        paramOriginals: JSON.parse(JSON.stringify(this.state.params || {})),
      });
    } catch (e) {
      this.setState({ paramOriginals: { ...(this.state.params || {}) } });
    }
    this.updateCommandFromProps(this.props);

    // Sync metadata panel with `sid` from the URL, like the flowchart page
    this.syncMetadataFromSid();
    // Listen for browser navigation changes to keep in sync
    window.addEventListener('popstate', this.syncMetadataFromSid);
  }

  componentDidUpdate(prevProps, prevState) {
    const pipelineChanged =
      prevProps.activePipeline !== this.props.activePipeline;
    const prevTags = (prevProps.selectedTags || []).slice().sort().join(',');
    const nextTags = (this.props.selectedTags || []).slice().sort().join(',');
    const tagsChanged = prevTags !== nextTags;
    if (pipelineChanged || tagsChanged) {
      this.updateCommandFromProps(this.props);
    }

    // If graph nodes change, attempt to (re)sync metadata for current sid
    if (
      prevProps.paramNodes !== this.props.paramNodes ||
      prevProps.datasets !== this.props.datasets
    ) {
      this.syncMetadataFromSid(/*force*/ false);
    }

    // Auto-scroll logs to bottom when content updates or when expanded toggles on
    try {
      const prevJobs = (prevState && prevState.jobs) || [];
      const currJobs = this.state.jobs || [];
      const prevExpanded = (prevState && prevState.expandedLogs) || {};
      const currExpanded = this.state.expandedLogs || {};

      const prevMap = new Map(prevJobs.map((j) => [j.jobId, j]));
      currJobs.forEach((job) => {
        const prevJob = prevMap.get(job.jobId);

        // Sync parameter editor once clicked metadata is available/updated
        if (
          this.state.metadataMode === 'param' &&
          this.state.selectedParamKey
        ) {
          const prevMeta = prevProps.clickedNodeMetaData;
          const currMeta = this.props.clickedNodeMetaData;
          if (
            currMeta &&
            currMeta !== prevMeta &&
            currMeta.id === this.state.selectedParamKey
          ) {
            const val = this.getEditedParamValue(this.state.selectedParamKey);
            const text = this.toYamlString(val) || '';
            if (
              this.state.metaEditText !== text ||
              this.state.yamlText !== text
            ) {
              this.setState({ metaEditText: text, yamlText: text });
            }
          }
        }
        const prevLogs = prevJob ? prevJob.logs : '';
        const logsChanged = prevJob ? prevLogs !== job.logs : !!job.logs;
        const wasExpanded =
          typeof prevExpanded[job.jobId] === 'boolean'
            ? prevExpanded[job.jobId]
            : true; // default on
        const isExpanded =
          typeof currExpanded[job.jobId] === 'boolean'
            ? currExpanded[job.jobId]
            : true; // default on
        const expandedBecameTrue = !wasExpanded && isExpanded;
        if ((logsChanged && isExpanded) || expandedBecameTrue) {
          const el = this.logRefs && this.logRefs[job.jobId];
          if (el && el.scrollTo) {
            // Smooth scroll could be jarring on frequent updates; use instant
            el.scrollTop = el.scrollHeight;
          } else if (el) {
            el.scrollTop = el.scrollHeight;
          }
        }
      });
    } catch (e) {
      // no-op: best-effort scrolling only
    }

    // If the watch list changes, refresh metadata for any parameter items
    if (prevState.watchList !== this.state.watchList) {
      this.refreshWatchParamsMetadata();
      // Keep editedParameters in sync with current watch list keys
      const watchKeys = new Set(
        (this.state.watchList || [])
          .filter((i) => i.kind === 'param')
          .map((i) => i.id)
      );
      if (this.state.editedParameters) {
        const pruned = Object.keys(this.state.editedParameters).reduce(
          (acc, key) => {
            if (watchKeys.has(key)) {
              acc[key] = this.state.editedParameters[key];
            }
            return acc;
          },
          {}
        );
        if (
          JSON.stringify(pruned) !== JSON.stringify(this.state.editedParameters)
        ) {
          this.setState({ editedParameters: pruned });
        }
      }
    }
  }

  componentWillUnmount() {
    // Clear any active pollers
    Object.values(this.jobPollers || {}).forEach((timerId) => {
      try {
        clearInterval(timerId);
      } catch (e) {
        // noop
      }
    });
    this.jobPollers = {};

    // Remove URL listener
    try {
      window.removeEventListener('popstate', this.syncMetadataFromSid);
    } catch (e) {
      // noop
    }
  }

  // --- URL selected-id (sid) sync helpers ---
  getSidFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search || '');
      // Prefer short key used by flowchart; fall back to legacy if present
      return params.get('sid') || params.get('selected_id') || '';
    } catch (e) {
      return '';
    }
  };

  syncMetadataFromSid = () => {
    const sid = this.getSidFromUrl();
    if (!sid || sid === this._lastSid) {
      return;
    }
    // Find a matching parameter or dataset node
    const paramNode = (this.props.paramNodes || []).find(
      (node) => node.id === sid
    );
    if (paramNode) {
      this._lastSid = sid;
      // Trigger lazy load like flowchart so metadata exists
      if (this.props.dispatch) {
        this.props.dispatch(loadNodeData(sid));
        this.props.dispatch(toggleNodeClicked(sid));
      }
      this.openParamEditor(sid);
      return;
    }
    const datasetNode = (this.props.datasets || []).find(
      (node) => node.id === sid
    );
    if (datasetNode) {
      this._lastSid = sid;
      if (this.props.dispatch) {
        this.props.dispatch(loadNodeData(sid));
        this.props.dispatch(toggleNodeClicked(sid));
      }
      this.openDatasetDetails(datasetNode);
      return;
    }
    // If sid no longer matches anything, don't change the current panel
  };

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
    const baseCmd = this.buildRunCommand(props);
    const paramsOverride = this.getParamsOverrideString
      ? this.getParamsOverrideString()
      : '';
    const cmd = paramsOverride
      ? `${baseCmd} --params ${this.quoteIfNeeded(paramsOverride)}`
      : baseCmd;
    if (this.commandInputRef && this.commandInputRef.current) {
      if (this.commandInputRef.current.value !== cmd) {
        this.commandInputRef.current.value = cmd;
      }
    }
  };

  // --- API helpers ---
  getApiBase = () => `${sanitizedPathname()}api`;

  addOrUpdateJob = (partial) => {
    // partial: {jobId, ...fields}
    if (!partial || !partial.jobId) {
      return;
    }
    this.setState(
      (prev) => {
        const list = [...(prev.jobs || [])];
        const idx = list.findIndex((j) => j.jobId === partial.jobId);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...partial };
        } else {
          list.unshift({
            jobId: partial.jobId,
            status: partial.status || 'initialize',
            startedAt: partial.startedAt || Date.now(),
            command:
              partial.command ||
              (this.commandInputRef.current &&
                this.commandInputRef.current.value) ||
              'kedro run',
            logs: partial.logs || '',
          });
        }
        return { jobs: list };
      },
      () => {
        this.saveJobsToStorage(this.state.jobs);
      }
    );
  };

  startJobPolling = (jobId) => {
    if (!jobId) {
      return;
    }
    // Avoid duplicate pollers
    if (this.jobPollers[jobId]) {
      clearInterval(this.jobPollers[jobId]);
    }
    this.jobPollers[jobId] = setInterval(() => {
      this.fetchJobStatus(jobId);
    }, 1000);
  };

  stopJobPolling = (jobId) => {
    const timerId = this.jobPollers[jobId];
    if (timerId) {
      clearInterval(timerId);
      delete this.jobPollers[jobId];
    }
  };

  fetchJobStatus = async (jobId) => {
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
      this.addOrUpdateJob(update);
      const isTerminalStatus = ['finished', 'terminated', 'error'].includes(
        status
      );
      const hasFinalReturnCode = typeof returncode === 'number';
      if (isTerminalStatus || hasFinalReturnCode) {
        this.stopJobPolling(jobId);
      }
    } catch (err) {
      this.addOrUpdateJob({ jobId, status: 'error' });
      this.stopJobPolling(jobId);
      // eslint-disable-next-line no-console
      console.error('Failed to fetch job status', err);
    }
  };

  // --- Persistence helpers ---
  sanitizeJobForStorage = (job) => {
    const maxLogLength = 50000; // limit stored logs size
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
  };

  saveJobsToStorage = (jobs) => {
    try {
      const payload = (jobs || []).map(this.sanitizeJobForStorage);
      window.localStorage.setItem(
        RUNNER_JOBS_STORAGE_KEY,
        JSON.stringify(payload)
      );
    } catch (e) {
      // ignore storage errors (quota/privacy mode)
    }
  };

  loadJobsFromStorage = () => {
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
    } catch (e) {
      return [];
    }
  };

  hydrateJobsFromStorage = () => {
    const jobs = this.loadJobsFromStorage();
    if (!jobs.length) {
      return;
    }
    this.setState({ jobs });
    // Resume polling for jobs that appear to be in-flight
    jobs.forEach((job) => {
      const isTerminal = ['finished', 'terminated', 'error'].includes(
        job.status
      );
      const hasFinalReturnCode = typeof job.returncode === 'number';
      if (
        (job.status === 'initialize' || job.status === 'running') &&
        !isTerminal &&
        !hasFinalReturnCode
      ) {
        this.startJobPolling(job.jobId);
      }
    });
  };

  // --- Watch list persistence ---
  loadWatchFromStorage = () => {
    let watchList = [];
    let customOrder = { param: false, dataset: false };
    try {
      const wlRaw = window.localStorage.getItem(RUNNER_WATCHLIST_STORAGE_KEY);
      if (wlRaw) {
        const parsed = JSON.parse(wlRaw);
        if (Array.isArray(parsed)) {
          watchList = parsed.filter(
            (item) =>
              item &&
              typeof item.kind === 'string' &&
              typeof item.id === 'string'
          );
        }
      }
    } catch (e) {
      // ignore
    }
    try {
      const coRaw = window.localStorage.getItem(
        RUNNER_WATCH_CUSTOM_ORDER_STORAGE_KEY
      );
      if (coRaw) {
        const parsed = JSON.parse(coRaw);
        if (parsed && typeof parsed === 'object') {
          customOrder = {
            param: !!parsed.param,
            dataset: !!parsed.dataset,
          };
        }
      }
    } catch (e) {
      // ignore
    }
    return { watchList, customOrder };
  };

  saveWatchToStorage = (watchList, customOrder) => {
    try {
      const watchListArray = Array.isArray(watchList)
        ? watchList
        : this.state.watchList;
      const customOrderObj = customOrder || this.state.customOrder || {};
      window.localStorage.setItem(
        RUNNER_WATCHLIST_STORAGE_KEY,
        JSON.stringify(watchListArray || [])
      );
      window.localStorage.setItem(
        RUNNER_WATCH_CUSTOM_ORDER_STORAGE_KEY,
        JSON.stringify({
          param: !!customOrderObj.param,
          dataset: !!customOrderObj.dataset,
        })
      );
    } catch (e) {
      // ignore storage errors
    }
  };

  hydrateWatchFromStorage = () => {
    const { watchList, customOrder } = this.loadWatchFromStorage();
    if ((watchList || []).length) {
      this.setState({ watchList });
    }
    if (customOrder) {
      this.setState({ customOrder });
    }
  };

  saveParamYaml = () => {
    const { selectedParamKey, yamlText } = this.state;
    const parsed = this.parseYamlishValue(yamlText);
    this.setState(
      (prev) => ({
        paramEdits: { ...(prev.paramEdits || {}), [selectedParamKey]: parsed },
        params: { ...(prev.params || {}), [selectedParamKey]: parsed },
        editedParameters: {
          ...(prev.editedParameters || {}),
          [selectedParamKey]: parsed,
        },
      }),
      () => this.updateCommandFromProps(this.props)
    );
  };

  resetParamYaml = () => {
    const { selectedParamKey } = this.state;
    const value = this.getParamValue(selectedParamKey);
    this.setState({ yamlText: this.toYamlString(value) });
  };

  // YAML stringifier using the 'yaml' package
  toYamlString(value) {
    try {
      return yamlStringify(value, { indent: 2, lineWidth: 0 });
    } catch (error) {
      return String(value);
    }
  }

  // YAML parser using the 'yaml' package (with safe fallbacks)
  parseYamlishValue(text) {
    if (text == null) {
      return '';
    }
    const str = String(text);
    if (!str.trim()) {
      return '';
    }
    try {
      return yamlParse(str);
    } catch (error) {
      try {
        return JSON.parse(str);
      } catch (error2) {
        return str;
      }
    }
  }

  // Resolve parameter value from metadata first, then Redux map, then local state
  getParamValue = (paramKey) => {
    const reduxMap = (this.props && this.props.nodeParameters) || {};
    if (Object.prototype.hasOwnProperty.call(reduxMap, paramKey)) {
      const val = reduxMap[paramKey];
      // Unwrap containers or maps
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        // Prefer explicit property if present
        if (Object.prototype.hasOwnProperty.call(val, paramKey)) {
          return val[paramKey];
        }
        const keys = Object.keys(val);
        if (keys.length === 1) {
          return val[keys[0]];
        }
      }
      // Some sources may return the key name itself; fallback to local map
      if (typeof val === 'string' && val === paramKey) {
        const localParams = this.state.params || {};
        if (Object.prototype.hasOwnProperty.call(localParams, paramKey)) {
          return localParams[paramKey];
        }
      }
      return val;
    }
    const local = this.state.params || {};
    return local[paramKey];
  };

  // Prefer existing editedParameters entry, fallback to resolved value
  getEditedParamValue = (paramKey) => {
    const edited = this.state.editedParameters || {};
    if (Object.prototype.hasOwnProperty.call(edited, paramKey)) {
      return edited[paramKey];
    }
    return this.getParamValue(paramKey);
  };

  // CLI-safe value formatting
  formatParamValueForCli = (value) => {
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
  };

  collectParamDiffs = (orig, edited, prefix) => {
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
            pairs.push(...this.collectParamDiffs(undefined, val, keyPath));
          } else {
            pairs.push(`${keyPath}=${this.formatParamValueForCli(val)}`);
          }
        });
      } else {
        pairs.push(`${prefix}=${this.formatParamValueForCli(edited)}`);
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
          return; // ignore deletions for now
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
          pairs.push(...this.collectParamDiffs(origVal, editedVal, keyPath));
        } else if (JSON.stringify(origVal) !== JSON.stringify(editedVal)) {
          pairs.push(`${keyPath}=${this.formatParamValueForCli(editedVal)}`);
        }
      });
      return pairs;
    }
    if (JSON.stringify(orig) !== JSON.stringify(edited)) {
      pairs.push(`${prefix}=${this.formatParamValueForCli(edited)}`);
    }
    return pairs;
  };

  getParamChangesPairs = () => {
    const { watchList, paramEdits, paramOriginals } = this.state;
    if (!watchList || !watchList.length) {
      return [];
    }
    const pairs = [];
    (watchList.filter((wlItem) => wlItem.kind === 'param') || []).forEach(
      (wlItem) => {
        const key = wlItem.id;
        if (!Object.prototype.hasOwnProperty.call(paramEdits || {}, key)) {
          return;
        }
        const edited = (paramEdits || {})[key];
        const orig = Object.prototype.hasOwnProperty.call(
          paramOriginals || {},
          key
        )
          ? (paramOriginals || {})[key]
          : (this.state.params || {})[key];
        pairs.push(...this.collectParamDiffs(orig, edited, key));
      }
    );
    return pairs;
  };

  getParamsOverrideString = () => {
    const pairs = this.getParamChangesPairs();
    return pairs.join(',');
  };

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
    // eslint-disable-next-line no-console
    console.log('[Runner] Start run clicked', command);
    startKedroCommand(command)
      .then(({ jobId, status }) => {
        if (!jobId) {
          throw new Error('No job_id returned');
        }
        this.addOrUpdateJob({
          jobId,
          status,
          startedAt: Date.now(),
          command,
          logs: '',
        });
        this.startJobPolling(jobId);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to start run', err);
      });
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

  // Toggle expand/collapse for job logs
  toggleLogExpanded = (jobId) => {
    this.setState((prev) => {
      const next = { ...(prev.expandedLogs || {}) };
      next[jobId] = !next[jobId];
      return { expandedLogs: next };
    });
  };

  openLogsModal = (jobId) => {
    this.setState({ isLogsModalOpen: true, logsModalJobId: jobId });
  };

  closeLogsModal = () => {
    this.setState({ isLogsModalOpen: false, logsModalJobId: null });
  };

  // Explicitly set expansion state for a job
  setLogExpanded = (jobId, value) => {
    this.setState((prev) => ({
      expandedLogs: { ...(prev.expandedLogs || {}), [jobId]: !!value },
    }));
  };

  // Clear all jobs with confirmation
  openClearJobsConfirm = () => {
    this.setState({ isClearJobsModalOpen: true });
  };

  closeClearJobsConfirm = () => {
    this.setState({ isClearJobsModalOpen: false });
  };

  clearAllJobs = () => {
    const jobs = this.state.jobs || [];
    jobs.forEach((j) => this.stopJobPolling(j.jobId));
    this.setState({ jobs: [] }, () => {
      this.saveJobsToStorage([]);
    });
    this.closeClearJobsConfirm();
  };

  // Per-job clear with confirmation
  openClearJobConfirm = (jobId) => {
    this.setState({ isClearJobModalOpen: true, clearJobModalJobId: jobId });
  };

  closeClearJobConfirm = () => {
    this.setState({ isClearJobModalOpen: false, clearJobModalJobId: null });
  };

  clearJob = (jobId) => {
    const id = jobId || this.state.clearJobModalJobId;
    if (!id) {
      return;
    }
    this.stopJobPolling(id);
    this.setState(
      (prev) => ({ jobs: (prev.jobs || []).filter((j) => j.jobId !== id) }),
      () => this.saveJobsToStorage(this.state.jobs)
    );
    this.closeClearJobConfirm();
  };

  onTerminateJob = (jobId) => {
    // eslint-disable-next-line no-console
    console.log('[Runner] Terminate job', jobId);
    cancelKedroCommand(jobId)
      .then(() => {
        this.stopJobPolling(jobId);
        this.addOrUpdateJob({ jobId, status: 'terminated' });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Terminate failed', err);
      });
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

  // Update URL to reflect selected node id (sid) for shareable/back-nav parity
  setSidInUrl = (nodeId) => {
    if (!nodeId) {
      return;
    }
    try {
      const current = new URL(window.location.href);
      // Preserve existing params, only update sid and clear sn
      current.searchParams.set('sid', nodeId);
      current.searchParams.delete('sn');
      const nextUrl = `${current.pathname}?${current.searchParams.toString()}`;
      window.history.pushState({}, '', nextUrl);
      // Avoid reprocessing immediately if a popstate happens
      this._lastSid = nodeId;
    } catch (e) {
      // noop
    }
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

    // For parameters, use the shared MetaData component; any dataset-specific panel remains below
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
            value={this.state.metaEditText}
            onChange={this.onMetaEditChange}
            spellCheck={false}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="btn btn--primary" onClick={this.onMetaEditSave}>
              Save
            </button>
            <button className="btn" onClick={this.onMetaEditReset}>
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
    this.setState(
      (prev) => {
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
        const nextCustom = {
          ...(prev.customOrder || {}),
          [kind]: true,
        };
        return {
          watchList: nextList,
          draggingWatch: null,
          customOrder: nextCustom,
        };
      },
      () => this.saveWatchToStorage()
    );
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
        const node = (this.props.paramNodes || []).find(
          (paramNode) => paramNode.id === id
        );
        return { kind, id, name: node?.name || id };
      }
      const dataset = (this.props.datasets || []).find((d) => d.id === id);
      return { kind, id, name: dataset?.name || id };
    });
    this.setState(
      (prev) => {
        const existingKeys = new Set(
          (prev.watchList || []).map((item) => `${item.kind}:${item.id}`)
        );
        const merged = [
          ...(prev.watchList || []),
          ...items.filter(
            (item) => !existingKeys.has(`${item.kind}:${item.id}`)
          ),
        ];
        return {
          watchList: merged,
          isWatchModalOpen: false,
          selectedToAdd: {},
        };
      },
      () => {
        this.saveWatchToStorage();
        this.refreshWatchParamsMetadata();
      }
    );
  };

  // Refresh metadata for all parameter nodes currently in the watch list
  refreshWatchParamsMetadata = () => {
    const list = this.state.watchList || [];
    if (!list.length || !this.props.dispatch) {
      return;
    }
    const paramIds = list
      .filter((item) => item.kind === 'param')
      .map((i) => i.id);
    paramIds.forEach((id) => {
      try {
        this.props.dispatch(loadNodeData(id));
      } catch (e) {
        // ignore dispatch errors
      }
    });
  };

  clearWatchList = () => {
    this.setState({ watchList: [] }, () => this.saveWatchToStorage());
  };

  removeFromWatchList = (kind, id) => {
    this.setState(
      (prev) => ({
        watchList: (prev.watchList || []).filter(
          (item) => !(item.kind === kind && item.id === id)
        ),
      }),
      () => this.saveWatchToStorage()
    );
  };

  onWatchItemClick = (item) => {
    if (item.kind === 'param') {
      // Reflect selection in URL like flowchart does
      this.setSidInUrl(item.id);
      if (this.props.dispatch) {
        this.props.dispatch(loadNodeData(item.id));
        this.props.dispatch(toggleNodeClicked(item.id));
      }
      this.openParamEditor(item.id);
    } else if (item.kind === 'dataset') {
      this.setSidInUrl(item.id);
      if (this.props.dispatch) {
        this.props.dispatch(loadNodeData(item.id));
        this.props.dispatch(toggleNodeClicked(item.id));
      }
      const dataset = (this.props.datasets || []).find(
        (datasetItem) => datasetItem.id === item.id
      );
      if (dataset) {
        this.openDatasetDetails(dataset);
      }
    }
  };

  openParamEditor = (paramKey) => {
    const existing = this.state.editedParameters || {};
    const value = Object.prototype.hasOwnProperty.call(existing, paramKey)
      ? existing[paramKey]
      : this.getParamValue(paramKey);
    // Dispatch node click to populate Redux metadata like flowchart/workflow
    if (this.props.dispatch) {
      // Ensure metadata is loaded if needed, then set clicked
      this.props.dispatch(loadNodeData(paramKey));
      this.props.dispatch(toggleNodeClicked(paramKey));
    }
    this.setState((prev) => ({
      showMetadata: true,
      metadataMode: 'param',
      selectedParamKey: paramKey,
      yamlText: this.toYamlString(value),
      metaEditText: this.toYamlString(value) || '',
      editedParameters: Object.prototype.hasOwnProperty.call(
        prev.editedParameters || {},
        paramKey
      )
        ? prev.editedParameters
        : { ...(prev.editedParameters || {}), [paramKey]: value },
    }));
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
      const value = this.getEditedParamValue(key);
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
              <div className="control-panel__header">
                <h3 className="section-title">Run command</h3>
                <button className="btn btn--primary" onClick={this.onStartRun}>
                  Start run
                </button>
              </div>
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
                  {this.getParamsOverrideString() && (
                    <button
                      className="btn"
                      onClick={() => this.setState({ isParamsModalOpen: true })}
                    >
                      Show param changes
                    </button>
                  )}
                </div>

                <div className="runner-manager__hints">
                  <small>
                    Pro tip: use <code>kedro run -n</code> to run a single node.
                  </small>
                </div>
              </div>
            </section>

            <section
              className="runner-manager__jobs-panel"
              ref={this.jobsPanelRef}
            >
              <div className="jobs-panel__header">
                <h3 className="section-title">Jobs</h3>
                <button
                  className="btn btn--secondary"
                  onClick={this.openClearJobsConfirm}
                  disabled={(this.state.jobs || []).length === 0}
                >
                  Clear jobs
                </button>
              </div>
              <div className="jobs-panel__body" ref={this.jobsPanelBodyRef}>
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

                  {(this.state.jobs || []).map((job) => {
                    const isExpanded = (this.state.expandedLogs || {})[
                      job.jobId
                    ];
                    const expanded =
                      typeof isExpanded === 'boolean' ? isExpanded : true; // default on
                    const stdoutStyle = {
                      display: expanded ? 'block' : 'none',
                      // When expanded, show up to 70% of the viewport height, and never exceed viewport
                      maxHeight: expanded ? '70vh' : '0px',
                      overflow: 'auto',
                    };
                    // Constrain card to available body height (accounts for sticky header)
                    const bodyHeight =
                      this.jobsPanelBodyRef?.current?.clientHeight || 0;
                    const cardMax = bodyHeight > 0 ? bodyHeight - 24 : 0;
                    const status = job.status;
                    const statusClass =
                      status === 'error' || status === 'terminated'
                        ? 'job-card__status--error'
                        : status === 'finished'
                        ? 'job-card__status--finished'
                        : 'job-card__status--pending';
                    const canTerminate = ![
                      'finished',
                      'error',
                      'terminated',
                    ].includes(status);
                    const cardClass = `job-card ${
                      canTerminate ? 'job-card--can-terminate' : ''
                    }`;
                    return (
                      <article
                        key={job.jobId}
                        className={cardClass}
                        style={cardMax ? { maxHeight: `${cardMax}px` } : null}
                      >
                        <div className="job-card__meta">
                          <div className={`job-card__status ${statusClass}`}>
                            {status}
                          </div>
                          <div className="job-card__time">
                            started{' '}
                            {new Date(job.startedAt).toLocaleTimeString()}
                          </div>
                          {/* Header actions on the right */}
                          <div
                            className="job-card__actions"
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              display: 'flex',
                              gap: '8px',
                            }}
                          >
                            {canTerminate && (
                              <button
                                className="btn btn--danger"
                                onClick={() => this.onTerminateJob(job.jobId)}
                                title="Terminate job"
                              >
                                Terminate
                              </button>
                            )}
                            <button
                              className="btn"
                              onClick={() => this.openLogsModal(job.jobId)}
                            >
                              View full logs
                            </button>
                            <button
                              className="btn"
                              onClick={() =>
                                this.openClearJobConfirm(job.jobId)
                              }
                              title="Remove this job from the list"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="job-card__body">
                          <div className="job-card__controls job-card__controls--top">
                            <div className="job-card__toggle pipeline-toggle">
                              <input
                                id={`pipeline-toggle-input-${job.jobId}`}
                                className="pipeline-toggle-input"
                                type="checkbox"
                                checked={expanded}
                                onChange={(e) =>
                                  this.setLogExpanded(
                                    job.jobId,
                                    e.target.checked
                                  )
                                }
                              />
                              <label
                                className={`pipeline-toggle-label ${
                                  expanded
                                    ? 'pipeline-toggle-label--checked'
                                    : ''
                                }`}
                                htmlFor={`pipeline-toggle-input-${job.jobId}`}
                              >
                                {expanded ? 'Collapse logs' : 'Expand logs'}
                              </label>
                            </div>
                          </div>
                          <div className="job-card__details">
                            <div className="job-card__row">
                              <strong>Job:</strong> {job.jobId}
                            </div>
                            <div className="job-card__row">
                              <strong>Command:</strong> {job.command}
                            </div>
                            <div className="job-card__row">
                              <strong>Duration:</strong>{' '}
                              {typeof job.duration !== 'undefined'
                                ? job.duration
                                : '—'}
                              {job.endTime && (
                                <>
                                  {' '}
                                  · ended{' '}
                                  {new Date(job.endTime).toLocaleTimeString()}
                                </>
                              )}
                            </div>
                          </div>
                          <div
                            className="job-card__stdout"
                            style={stdoutStyle}
                            ref={(el) => {
                              this.logRefs[job.jobId] = el;
                            }}
                          >
                            <pre>{job.logs}</pre>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Editor replaced with Watch List */}
            <section className="runner-manager__editor">
              <div className="editor__header">
                <h3 className="section-title">Watch list</h3>
                <div className="editor__actions">
                  <button
                    className="btn btn--secondary"
                    onClick={this.openWatchModal}
                  >
                    Add
                  </button>
                  <button
                    className="btn btn--secondary"
                    onClick={this.clearWatchList}
                    disabled={!(this.state.watchList || []).length}
                  >
                    Clear
                  </button>
                </div>
              </div>
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
          {this.state.isClearJobsModalOpen && (
            <div
              className="runner-logs-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Clear jobs confirmation"
            >
              <div className="runner-logs-modal__content">
                <div className="runner-logs-modal__header">
                  <h3 className="runner-logs-modal__title">Clear all jobs</h3>
                  <button
                    className="runner-logs-modal__close"
                    aria-label="Close"
                    onClick={this.closeClearJobsConfirm}
                  >
                    ×
                  </button>
                </div>
                <div className="runner-logs-modal__body">
                  <p>
                    Are you sure you want to clear the jobs list? This will
                    remove all jobs from the panel.
                  </p>
                </div>
                <div className="runner-logs-modal__footer">
                  <button className="btn" onClick={this.closeClearJobsConfirm}>
                    Cancel
                  </button>
                  <button
                    className="btn btn--danger"
                    onClick={this.clearAllJobs}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
          {this.state.isParamsModalOpen && (
            <div
              className="runner-logs-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Parameter changes dialog"
            >
              <div className="runner-logs-modal__content">
                <div className="runner-logs-modal__header">
                  <h3 className="runner-logs-modal__title">
                    Parameter changes
                  </h3>
                  <button
                    className="runner-logs-modal__close"
                    aria-label="Close"
                    onClick={() => this.setState({ isParamsModalOpen: false })}
                  >
                    ×
                  </button>
                </div>
                <div className="runner-logs-modal__body">
                  <pre>
                    {this.getParamsOverrideString() || 'No parameter changes.'}
                  </pre>
                </div>
                <div className="runner-logs-modal__footer">
                  <button
                    className="btn"
                    onClick={() => this.setState({ isParamsModalOpen: false })}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {this.state.isClearJobModalOpen && (
            <div
              className="runner-logs-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Clear job confirmation"
            >
              <div className="runner-logs-modal__content">
                <div className="runner-logs-modal__header">
                  <h3 className="runner-logs-modal__title">Remove job</h3>
                  <button
                    className="runner-logs-modal__close"
                    aria-label="Close"
                    onClick={this.closeClearJobConfirm}
                  >
                    ×
                  </button>
                </div>
                <div className="runner-logs-modal__body">
                  <p>
                    Remove this job from the list? This won’t affect any running
                    process.
                  </p>
                </div>
                <div className="runner-logs-modal__footer">
                  <button className="btn" onClick={this.closeClearJobConfirm}>
                    Cancel
                  </button>
                  <button
                    className="btn btn--danger"
                    onClick={() => this.clearJob()}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
          {this.state.isLogsModalOpen && (
            <div
              className="runner-logs-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Job logs dialog"
            >
              <div className="runner-logs-modal__content">
                <div className="runner-logs-modal__header">
                  <h3 className="runner-logs-modal__title">Job logs</h3>
                  <button
                    className="runner-logs-modal__close"
                    aria-label="Close"
                    onClick={this.closeLogsModal}
                  >
                    ×
                  </button>
                </div>
                <div className="runner-logs-modal__body">
                  <pre>
                    {(this.state.jobs || []).find(
                      (j) => j.jobId === this.state.logsModalJobId
                    )?.logs || ''}
                  </pre>
                </div>
                <div className="runner-logs-modal__footer">
                  <button className="btn" onClick={this.closeLogsModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  displaySidebar: state.display.sidebar,
  sidebarVisible: state.visible.sidebar,
  displayGlobalNavigation: state.display.globalNavigation,
  theme: state.theme,
  // Visible datasets from the current graph; we only need data nodes
  datasets: getVisibleNodes(state).filter((node) => node.type === 'data'),
  // Also expose parameter nodes for selection in the watch modal
  paramNodes: getVisibleNodes(state).filter(
    (node) => node.type === 'parameters'
  ),
  // Provide parameters map used by the flowchart metadata panel
  nodeParameters: state.node?.parameters || {},
  // Clicked node metadata to mirror flowchart/workflow param sourcing
  clickedNodeMetaData: getClickedNodeMetaData(state),
  activePipeline: state.pipeline.active,
  // Only include enabled tags that are present in the active pipeline; use raw IDs
  selectedTags: getTagData(state)
    .filter((tag) => tag.enabled)
    .map((tag) => tag.id),
});

export default connect(mapStateToProps)(KedroRunManager);
