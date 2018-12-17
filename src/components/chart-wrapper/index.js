import React, { Component } from 'react';
import classnames from 'classnames';
import { Icon } from '@quantumblack/carbon-ui-components';
import SidebarTabs from '../sidebar-tabs';
import FlowChart from '../flowchart';
import Description from '../description';
import './chart-wrapper.css';

class ChartWrappper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleNav: false
    };

    // Pre-bind these methods to prevent the 'removeEventListener and bind(this) gotcha'
    // (See https://gist.github.com/Restuta/e400a555ba24daa396cc)
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.closeNav = this.closeNav.bind(this);
  }

  componentWillMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(e) {
    const ESCAPE_KEY = 27;
    if (e.keyCode === ESCAPE_KEY) {
      this.closeNav();
    }
  }

  toggleNav() {
    const visibleNav = !this.state.visibleNav;
    this.setState({ visibleNav });
  }

  closeNav() {
    this.setState({
      visibleNav: false
    });
  }

  render() {
    const { visibleNav } = this.state;
    const { chartParams, theme, showHistory } = this.props;
    const { data } = chartParams;
    const chartHasData = Boolean(data && data.nodes && data.nodes.length);

    return (
      <div className={classnames('kernel-pipeline', {
        'cbn-theme--dark': theme === 'dark',
        'cbn-theme--light': theme === 'light',
      })}>
        <div className={classnames('pipeline-wrapper', {
          'pipeline-wrapper--menu-visible': visibleNav
        })}>
          <nav
            className={classnames('pipeline-sidebar', { 'pipeline-sidebar--visible': visibleNav })}
            ref={el => {
              this.nav = el;
            }}>
            <button
              className="pipeline-sidebar__menu pipeline-icon-button"
              onClick={this.toggleNav.bind(this)}>
              { visibleNav ? (
                <Icon type="close" title="Close" theme={theme} />
              ) : (
                <svg className="menu-icon" viewBox="0 0 24 24">
                  <rect x="2" y="5" width="20" height="2" />
                  <rect x="2" y="11" width="20" height="2" />
                  <rect x="2" y="17" width="20" height="2" />
                </svg>
              )}
            </button>
            <SidebarTabs {...this.props} />
          </nav>
          <div onClick={this.closeNav}>
            { chartHasData && (
              <FlowChart {...chartParams} visibleNav={visibleNav} />
            ) }
            { showHistory && (
              <Description pipelineData={this.props.pipelineData} 
                    activePipelineData={this.props.activePipelineData}/>
            ) }
          </div>
        </div>
      </div>
    );
  }
}

export default ChartWrappper;
