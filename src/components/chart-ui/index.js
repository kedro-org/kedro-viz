import React from 'react';
import classnames from 'classnames';
import {
  Checkbox,
  RadioButton,
  Toggle,
} from '@quantumblack/carbon-ui-components';
import UploadSnapshot from '../upload-snapshot';
import './chart-ui.css';
import { Scrollbars } from 'react-custom-scrollbars'

const shorten = (text, n) => (text.length > n ? text.substr(0, n) + '…' : text);

const ChartUI = ({
  allowUploads,
  activePipelineData,
  onChangeView,
  onNodeUpdate,
  onToggleParameters,
  onToggleTextLabels,
  parameters,
  textLabels,
  theme,
  view
}) => activePipelineData ? (
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
    { activePipelineData.nodes && (
      <Scrollbars
        className='pipeline-ui__node-list-container'
        style={{ width: 'auto' }}
        autoHide
        hideTracksWhenNotNeeded
      >
        <ul className="pipeline-ui__node-list">
          { activePipelineData.nodes.map(node => (
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
      </Scrollbars>
    )}
    <UploadSnapshot
      allowUploads={allowUploads}
      data={activePipelineData}
      theme={theme} />
  </div>
) : null;

export default ChartUI;
