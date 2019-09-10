import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Icon from '@quantumblack/kedro-ui/lib/components/icon';
import ChartUI from '../chart-ui';
import FlowChart from '../flowchart';
import './wrapper.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 */
export class Wrapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleNav: true
    };
  }

  toggleNav() {
    const visibleNav = !this.state.visibleNav;
    this.setState({ visibleNav });
  }

  render() {
    const { visibleNav } = this.state;
    const { theme } = this.props;

    return (
      <div
        className={classnames('kedro-pipeline', {
          'kui-theme--dark': theme === 'dark',
          'kui-theme--light': theme === 'light'
        })}>
        <div className="pipeline-wrapper">
          <FlowChart visibleNav={visibleNav} />
        </div>
        <button
          aria-label="Show menu"
          className="pipeline-sidebar__show-menu pipeline-icon-button"
          onClick={this.toggleNav.bind(this)}>
          <svg className="menu-icon" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="2" />
            <rect x="2" y="11" width="20" height="2" />
            <rect x="2" y="17" width="20" height="2" />
          </svg>
        </button>
        <nav
          className={classnames('pipeline-sidebar', {
            'pipeline-sidebar--visible': visibleNav
          })}>
          <button
            aria-label="Hide menu"
            className={classnames(
              'pipeline-sidebar__hide-menu pipeline-icon-button',
              {
                'pipeline-sidebar__hide-menu--visible': visibleNav
              }
            )}
            onClick={this.toggleNav.bind(this)}>
            <Icon type="close" title="Close" theme={theme} />
          </button>
          <ChartUI />
        </nav>
      </div>
    );
  }
}

export const mapStateToProps = state => ({
  theme: state.theme
});

export default connect(mapStateToProps)(Wrapper);
