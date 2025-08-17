import React, { Component } from 'react';
import { connect } from 'react-redux';
import Sidebar from '../sidebar';
// Reuse existing metadata panel styles
import '../metadata/styles/metadata.scss';
import MetaDataStats from '../metadata/metadata-stats';
import { getVisibleNodes } from '../../selectors/nodes';
import './runner-manager.scss';

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
    };
  }

  componentWillUnmount() {
    const appRoot = document.querySelector('.kedro-pipeline');
    if (appRoot) {
      appRoot.classList.remove('kui-theme--light');
      if (this._prevWasDark) {
        appRoot.classList.add('kui-theme--dark');
      }
      if (this._prevWasLight) {
        appRoot.classList.add('kui-theme--light');
      }
    }
  }

  // --- Helpers for filtering/lists ---
  getFilteredParams() {
    const { params, filterText } = this.state;
    const query = filterText.trim().toLowerCase();
    const entries = Object.entries(params || {});
    if (!query) {
      return entries;
    }
    return entries.filter(([key, value]) =>
      `${key} ${JSON.stringify(value)}`.toLowerCase().includes(query)
    );
  }

  getFilteredDatasets() {
    const { datasets } = this.props;
    const { filterText } = this.state;
    const query = filterText.trim().toLowerCase();
    const list = datasets || [];
    if (!query) {
      return list;
    }
    return list.filter((dataset) =>
      `${dataset.name} ${dataset.fullName} ${dataset.type}`
        .toLowerCase()
        .includes(query)
    );
  }

  // --- Parameter interactions ---
  toggleParamExpanded = (key) => {
    this.setState((prevState) => ({
      expandedParams: {
        ...prevState.expandedParams,
        [key]: !prevState.expandedParams[key],
      },
    }));
  };

  openParamEditor = (key) => {
    const value = this.state.params?.[key];
    // Naive YAML-ish seed. Replace with real YAML from API if available.
    const yaml = this.toYamlString(value);
    this.setState({
      showMetadata: true,
      metadataMode: 'param',
      selectedParamKey: key,
      yamlText: yaml,
    });
  };

  saveParamYaml = () => {
    const { selectedParamKey, yamlText } = this.state;
    // API: PUT `${basePath}/api/runner/parameters/${selectedParamKey}` with YAML body
    // fetch(url, { method: 'PUT', headers: { 'Content-Type': 'text/yaml' }, body: yamlText })
    //   .then(() => ...)
    //   .catch(() => ...);
    // For now, just keep the panel open.
    // Optionally, you could update local params after parsing the YAML.
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
    // GET `${basePath}/api/runner/datasets/${dataset.id}`
    this.setState({
      showMetadata: true,
      metadataMode: 'dataset',
      selectedDataset: dataset,
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
    const items = this.getFilteredParams();
    const { expandedParams } = this.state;

    return (
      <div className="runner-panel runner-panel--parameters">
        <div className="runner-panel__toolbar">
          <input
            className="runner-filter-input"
            placeholder="Filter parameters..."
            value={this.state.filterText}
            onChange={(e) => this.setState({ filterText: e.target.value })}
          />
          {/* API: Add sync button to refetch parameters */}
        </div>
        <ul className="param-list">
          {items.map(([key, value]) => (
            <li key={key} className="param-item">
              <div className="param-item__head">
                <button
                  className="param-item__expand"
                  onClick={() => this.toggleParamExpanded(key)}
                  aria-expanded={!!expandedParams[key]}
                >
                  {expandedParams[key] ? '▾' : '▸'}
                </button>
                <div className="param-item__meta">
                  <div className="param-item__key">{key}</div>
                  <div className="param-item__value">
                    {typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)}
                  </div>
                </div>
                <div className="param-item__actions">
                  <button
                    className="btn"
                    onClick={() => this.openParamEditor(key)}
                  >
                    Edit
                  </button>
                </div>
              </div>
              {expandedParams[key] && (
                <div className="param-item__body">
                  <pre className="param-item__preview">
                    {this.toYamlString(value)}
                  </pre>
                </div>
              )}
            </li>
          ))}
          {items.length === 0 && (
            <li className="param-item param-item--empty">
              No parameters match your filter.
            </li>
          )}
        </ul>
      </div>
    );
  }

  renderDatasetsTab() {
    const datasets = this.getFilteredDatasets();
    return (
      <div className="runner-panel runner-panel--datasets">
        <div className="runner-panel__toolbar">
          <input
            className="runner-filter-input"
            placeholder="Filter datasets..."
            value={this.state.filterText}
            onChange={(e) => this.setState({ filterText: e.target.value })}
          />
          {/* API: Add sync button to refetch dataset metadata */}
        </div>
        <ul className="dataset-list">
          {datasets.map((dataset) => (
            <li
              key={dataset.id}
              className="dataset-item"
              onClick={() => this.openDatasetDetails(dataset)}
            >
              <div className="dataset-item__name">{dataset.name}</div>
              <div className="dataset-item__type">
                {dataset.datasetType || dataset.type}
              </div>
            </li>
          ))}
          {datasets.length === 0 && (
            <li className="dataset-item dataset-item--empty">
              No datasets match your filter.
            </li>
          )}
        </ul>
      </div>
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
                <div className="overview-item__value">0</div>
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
                    defaultValue="kedro run"
                  />
                </div>
                {/* Additional controls/configuration can go here */}
              </div>
              <div className="runner-manager__control-footer">
                <div className="runner-manager__actions">
                  <button className="btn btn--primary">Start run</button>
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
                <article className="job-card">
                  <div className="job-card__meta">
                    <div className="job-card__id">job-0001</div>
                    <div className="job-card__status job-card__status--running">
                      running
                    </div>
                    <div className="job-card__time">started 00:01:23 ago</div>
                  </div>

                  <div className="job-card__body">
                    <div className="job-card__stdout">
                      <pre>{`[INFO] Starting Kedro...
[INFO] Loading pipeline...
[INFO] Running node: preprocess`}</pre>
                    </div>
                    <div className="job-card__controls">
                      <button className="btn">View full logs</button>
                      <button className="btn btn--danger">Terminate</button>
                    </div>
                  </div>
                </article>

                {/* Placeholder for more jobs */}
              </div>
            </section>

            {/* Editor moved to the bottom, spans full width */}
            <section className="runner-manager__editor">
              <h3 className="section-title">Editor</h3>
              <div className="runner-data-panel">
                <div className="runner-tabs" role="tablist">
                  <button
                    role="tab"
                    aria-selected={activeTab === 'parameters'}
                    className={`runner-tab ${
                      activeTab === 'parameters' ? 'runner-tab--active' : ''
                    }`}
                    onClick={() =>
                      this.setState({ activeTab: 'parameters', filterText: '' })
                    }
                  >
                    Parameters
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'datasets'}
                    className={`runner-tab ${
                      activeTab === 'datasets' ? 'runner-tab--active' : ''
                    }`}
                    onClick={() =>
                      this.setState({ activeTab: 'datasets', filterText: '' })
                    }
                  >
                    Datasets
                  </button>
                </div>

                {activeTab === 'parameters'
                  ? this.renderParametersTab()
                  : this.renderDatasetsTab()}
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
});

export default connect(mapStateToProps)(KedroRunManager);
