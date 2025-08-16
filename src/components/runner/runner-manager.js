import React, { Component } from 'react';
import { connect } from 'react-redux';
import Sidebar from '../sidebar';
import './runner-manager.scss';

/**
 * KedroRunManager
 * A visual draft page for starting and monitoring Kedro runs.
 * No functional wiring — purely presentational scaffolding you can hook up later.
 */
class KedroRunManager extends Component {
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

  render() {
    const { displaySidebar, sidebarVisible, displayGlobalNavigation } =
      this.props;

    const wrapperClassNames = [
      'runner-manager',
      displaySidebar ? 'runner-manager--with-sidebar' : null,
      displaySidebar && sidebarVisible ? 'runner-manager--sidebar-open' : null,
      !displayGlobalNavigation ? 'runner-manager--no-global-toolbar' : null,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="runner-manager">
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
            <div className="control-row">
              <label className="control-row__label">Command</label>
              <input className="control-row__input" defaultValue="kedro run" />
            </div>
            <div className="runner-manager__actions">
              <button className="btn btn--primary">Start run</button>
            </div>

            <div className="runner-manager__hints">
              <small>
                Pro tip: use <code>kedro run -n</code> to run a single node.
              </small>
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
        </main>

        <footer className="runner-manager__footer">
          <small>
            UI draft — not wired to backend. Connect `/api/run-kedro-command`
            and status polling to make it live.
          </small>
        </footer>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  displaySidebar: state.display.sidebar,
  sidebarVisible: state.visible.sidebar,
  displayGlobalNavigation: state.display.globalNavigation,
});

export default connect(mapStateToProps)(KedroRunManager);
