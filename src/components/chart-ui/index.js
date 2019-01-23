import React from 'react';
import {
  Checkbox,
  Dropdown,
  RadioButton,
  Toggle,
} from '@quantumblack/carbon-ui-components';
import NodeList from '../node-list';
import UploadSnapshot from '../upload-snapshot';
import './chart-ui.css';
import { Scrollbars } from 'react-custom-scrollbars';

const ChartUI = ({
  allowUploads,
  activePipelineData,
  onChangeView,
  onNodeUpdate,
  onToggleTextLabels,
  onTagUpdate,
  parameters,
  textLabels,
  theme,
  view
}) => activePipelineData ? (
  <Scrollbars autoHide hideTracksWhenNotNeeded>
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
            label="Node"
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
        onChange={(e, { value }) => onNodeUpdate(
          node => node.name.includes('param'),
          'disabled',
          !Boolean(value),
          true
        )}
        label="Parameters"
        value={parameters}
        checked={parameters}
        theme={theme}
      />
    { activePipelineData.tags && (
      <Dropdown theme={theme} width={null} defaultText="Tags (all)">
        <React.Fragment>
          <ul className="pipeline-ui__tag-list">
            { activePipelineData.tags.map(tag => (
              <li key={`tag-${tag.id}`} className="cbn-menu-option">
                <Checkbox
                  checked={!tag.disabled}
                  label={<span>{tag.name}</span>}
                  name={tag.name}
                  onChange={(e, { checked }) => {
                    onTagUpdate(d => d.id === tag.id, 'disabled', !checked);
                  }}
                  theme={theme} />
              </li>
            )) }
          </ul>
        </React.Fragment>
      </Dropdown>
    )}
      { activePipelineData.nodes && (
        <NodeList
          nodes={activePipelineData.nodes}
          onNodeUpdate={onNodeUpdate}
          theme={theme} />
      ) }
      <UploadSnapshot
        allowUploads={allowUploads}
        data={activePipelineData}
        theme={theme} />
    </div>
  </Scrollbars>
) : null;

export default ChartUI;
