import React, { Component } from 'react';
import classnames from 'classnames';
import {
  Checkbox,
  RadioButton,
  Toggle,
  Button
} from '@quantumblack/carbon-ui-components';
import config from '../../config';
import './chart-ui.css';

const shorten = (text, n) => (text.length > n ? text.substr(0, n) + '…' : text);

class ChartUI extends Component {
  constructor(props) {
    super(props);

    this.state = {
    };

    this.syncStudioData = this.syncStudioData.bind(this);
  }

  getStudioToken() {
    const store = window.localStorage;
    const storeKey = `${config.localStorageName}_token`;
    const storeToken = store.getItem(storeKey);
    const tokenMessage = storeToken ? `Your stored StudioAI token is ${storeToken}. Enter a new one below or click cancel to keep the previous one.` : 'Please enter a StudioAI project token';
    const newToken = window.prompt(tokenMessage);

    if (newToken) {
      store.setItem(storeKey, newToken);
    }

    return newToken || storeToken;
  }

  syncStudioData() {
    const url = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/public/kernelai'
      : 'https://dev.qbstudioai.com/api/public/kernelai';
    const token = this.getStudioToken();
    if (!token) {
      return;
    }
    const message = window.prompt('Please enter a snapshot description');
    if (message) {
      fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message,
            schema: JSON.stringify(this.props.data.raw)
        })
      })
      .then(response => {
        alert(response.ok ? 'Your data snapshot has been synced successfully!' : 'Upload failed :(')
        console.log(response);
      })
    }
  }

  render() {
    const {
      allowUploads,
      data,
      onChangeView,
      onNodeUpdate,
      onToggleParameters,
      onToggleTextLabels,
      parameters,
      textLabels,
      theme,
      view
    } = this.props;

    return (
      <div className="pipeline-ui">
        <ul className="pipeline-ui__view">
          <li>
            <RadioButton
              checked={view === 'combined'}
              label="Combined"
              name="view"
              onChange={onChangeView}
              value="combined"
              theme={theme}
            />
          </li>
          <li>
            <RadioButton
              checked={view === 'data'}
              label="Data"
              name="view"
              onChange={onChangeView}
              value="data"
              theme={theme}
            />
          </li>
          <li>
            <RadioButton
              checked={view === 'task'}
              label="Task"
              name="view"
              onChange={onChangeView}
              value="task"
              theme={theme}
            />
          </li>
        </ul>
        <Toggle
          onChange={(e, { value }) => onToggleTextLabels(Boolean(value))}
          label="Labels"
          value={textLabels}
          checked={textLabels}
          theme={theme}
        />
        <Toggle
          onChange={(e, { value }) => onToggleParameters(Boolean(value))}
          label="Parameters"
          value={parameters}
          checked={parameters}
          theme={theme}
        />
        <ul className="pipeline-ui__node-list">
          {data.nodes.map(node => (
            <li
              className={classnames('pipeline-ui__node', {
                'pipeline-ui__node--active': node.active
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
        { allowUploads && (
          <Button theme={theme} onClick={this.syncStudioData}>Upload Snapshot to StudioAI</Button>
        )}
      </div>
    );
  }
}

export default ChartUI;
