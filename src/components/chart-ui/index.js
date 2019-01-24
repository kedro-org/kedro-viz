import React from 'react';
import { connect } from 'react-redux';
import {
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
  count,
  dispatch,
  onChangeView,
  onNodeUpdate,
  onToggleTextLabels,
  parameters,
  textLabels,
  theme,
  view
}) => activePipelineData ? (
  <Scrollbars autoHide hideTracksWhenNotNeeded>
    <div className="pipeline-ui">
      {/* TODO remove this */}
      count: { count }
      <button onClick={e => {
        dispatch({ type: 'INCREMENT' });
      }}>+</button>
      <button onClick={e => {
        dispatch({ type: 'DECREMENT' });
      }}>-</button>
      {/* TODO remove this ^ */}
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

const mapStateToProps = (state) => ({
  count: state.count
});

export default connect(mapStateToProps)(ChartUI);
