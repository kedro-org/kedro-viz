import React from 'react';
import { connect } from 'react-redux';
import {
  RadioButton,
  Toggle,
} from '@quantumblack/carbon-ui-components';
import {
  changeView,
  toggleParameters,
  toggleTextLabels,
} from '../../actions';
import NodeList from '../node-list';
import UploadSnapshot from '../upload-snapshot';
import './chart-ui.css';
import { Scrollbars } from 'react-custom-scrollbars';

const ChartUI = ({
  allowUploads,
  activePipelineData,
  dispatch,
  onNodeUpdate,
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
            onChange={(e, { value }) => {
              dispatch(changeView(value));
            }}
            value="combined"
            theme={theme}
          />
        </li>
        <li>
          <RadioButton
            checked={view === 'data'}
            label="Data"
            name="view"
            onChange={(e, { value }) => {
              dispatch(changeView(value));
            }}
            value="data"
            theme={theme}
          />
        </li>
        <li>
          <RadioButton
            checked={view === 'task'}
            label="Node"
            name="view"
            onChange={(e, { value }) => {
              dispatch(changeView(value));
            }}
            value="task"
            theme={theme}
          />
        </li>
      </ul>
      <Toggle
        onChange={(e, { value }) => dispatch(toggleTextLabels(Boolean(value)))}
        label="Labels"
        value={textLabels}
        checked={textLabels}
        theme={theme}
      />
      <Toggle
        onChange={(e, { value }) => {
          onNodeUpdate(
            node => node.name.includes('param'),
            'disabled',
            !Boolean(value)
          );
          dispatch(toggleParameters(value));
        }}
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
  textLabels: state.textLabels,
  parameters: state.parameters,
  view: state.view
});

export default connect(mapStateToProps)(ChartUI);
