import React, { Component } from 'react';
import classnames from 'classnames';
import { Checkbox, Icon, Toggle } from '@quantumblack/carbon-ui-components';
import './chart-ui.css';
const shorten = (text, n) => (text.length > n ? text.substr(0, n) + '…' : text);

class ChartUI extends Component {
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

  // TODO remove this
  componentDidMount() {
    this.toggleNav();
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

  toggleBodyClass(visible) {
    document.body.classList.toggle('menu-visible', visible);
  }

  toggleNav() {
    const visibleNav = !this.state.visibleNav;
    this.setState({ visibleNav });
    this.toggleBodyClass(visibleNav);
  }

  closeNav(target) {
    this.toggleBodyClass(false);
    this.setState({
      visibleNav: false
    });
  }

  render() {
    const { visibleNav } = this.state;
    const {
      data,
      onHighlightNodes,
      onToggleNodes,
      onToggleTextLabels,
      textLabels,
      theme
    } = this.props;

    return (
      <nav
        className={classnames('chart-ui', { 'chart-ui--visible': visibleNav })}
        ref={el => {
          this.nav = el;
        }}>
        <button
          className="chart-ui__menu icon-button"
          onClick={this.toggleNav.bind(this)}
          ref={el => {
            this.menuButton = el;
          }}>
          {visibleNav ? (
            <Icon type="close" title="Close" theme={theme} />
          ) : (
            <svg className="menu-icon" viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="2" />
              <rect x="2" y="11" width="20" height="2" />
              <rect x="2" y="17" width="20" height="2" />
            </svg>
          )}
        </button>
        <Toggle
          onChange={(e, { value }) => onToggleTextLabels(Boolean(value))}
          label="Labels"
          value={textLabels}
          theme={theme}
        />
        <ul>
          {data.nodes.map(node => (
            <li
              key={node.id}
              onMouseEnter={() => {
                onHighlightNodes(node.id, true);
              }}
              onMouseLeave={() => {
                onHighlightNodes(node.id, false);
              }}>
              <Checkbox
                checked={!node.disabled}
                label={shorten(node.name, 30)}
                name={node.name}
                onChange={(e, { checked }) => {
                  onToggleNodes(node.id, !checked);
                }}
                theme={theme}
              />
            </li>
          ))}
        </ul>
      </nav>
    );
  }
}

export default ChartUI;
