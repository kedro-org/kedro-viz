import React, { Component } from 'react';
import classnames from 'classnames';
import {
  Checkbox,
  Icon,
  RadioButton,
  Toggle
} from '@quantumblack/carbon-ui-components';
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
      onChangeView,
      onNodeUpdate,
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
        <ul className="chart-ui__view">
          <li>
            <RadioButton
              checked={true}
              label="Combined"
              name="view"
              onChange={onChangeView}
              value="combined"
              theme={theme}
            />
          </li>
          <li>
            <RadioButton
              checked={false}
              label="Data"
              name="view"
              onChange={onChangeView}
              value="data"
              theme={theme}
            />
          </li>
          <li>
            <RadioButton
              checked={false}
              label="Task"
              name="view"
              onChange={onChangeView}
              value="task"
              theme={theme}
            />
          </li>
        </ul>
        <ul className="chart-ui__node-list">
          {data.nodes.map(node => (
            <li
              className={classnames('chart-ui__node', {
                'chart-ui__node--active': node.active
              })}
              key={node.id}
              onMouseEnter={() => {
                onNodeUpdate(node.id, 'active', true);
              }}
              onMouseLeave={() => {
                onNodeUpdate(node.id, 'active', false);
              }}>
              <Checkbox
                checked={!node.disabled}
                label={shorten(node.name, 30)}
                name={node.name}
                onChange={(e, { checked }) => {
                  onNodeUpdate(node.id, 'disabled', !checked);
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
