import React, { Component } from 'react';
import classnames from 'classnames';
import { Icon } from '@quantumblack/carbon-ui-components';
import ChartUI from '../chart-ui';
import './chart-wrapper.css';

class ChartWrappper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleNav: false
    };

    // Pre-bind these methods to prevent the 'removeEventListener and bind(this) gotcha'
    // (See https://gist.github.com/Restuta/e400a555ba24daa396cc)
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.closeNav = this.closeNav.bind(this);
  }

  componentWillMount() {
    document.addEventListener('click', this.handleDocumentClick, false);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocumentClick, false);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleDocumentClick(e) {
    if (this.state.visibleNav && !this.nav.contains(e.target)) {
      this.closeNav();
    }
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
    const { children, theme } = this.props;

    return (
      <div
        className={classnames('chart-wrapper', {
          'cbn-theme--dark': theme === 'dark',
          'cbn-theme--light': theme === 'light',
          'chart-wrapper--menu-visible': visibleNav
        })}>
        <nav
          className={classnames('chart-sidebar', { 'chart-sidebar--visible': visibleNav })}
          ref={el => {
            this.nav = el;
          }}>
          <button
            className="chart-sidebar__menu icon-button"
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
          <ChartUI {...this.props} />
        </nav>
        { children }
      </div>
    );
  }
}

export default ChartWrappper;
