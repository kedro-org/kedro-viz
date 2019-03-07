import React from 'react';
import { connect } from 'react-redux';
import {
  RadioButton,
  Toggle,
} from '@quantumblack/carbon-ui-components';
import {
  changeView,
  toggleParameters,
  toggleTextLabels
} from '../../actions';
import { getNodes } from '../../selectors';
import TagList from '../tag-list';
import NodeList from '../node-list';
import UploadSnapshot from '../upload-snapshot';
import './chart-ui.css';
import { Scrollbars } from 'react-custom-scrollbars';

/**
 * Main contols for filtering the chart data
 * @param {Array} nodes List of nodes
 * @param {Function} onToggleParameters Handle toggling parameters on/off
 * @param {Function} onToggleTextLabels Handle toggling text labels on/off
 * @param {Function} onChangeView Handle changing view between combined/task/data
 * @param {Boolean} parameters Whether parameters are displayed
 * @param {Boolean} textLabels Whether text labels are displayed
 * @param {string} theme CarbonUI light/dark theme
 * @param {string} view Which node types are displayed: combined/task/data
 */
const ChartUI = ({
  nodes,
  onToggleParameters,
  onToggleTextLabels,
  onChangeView,
  parameters,
  textLabels,
  theme,
  view
}) => nodes ? (
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
        onChange={onToggleTextLabels}
        label="Labels"
        value={textLabels}
        checked={textLabels}
        theme={theme}
      />
      <Toggle
        onChange={onToggleParameters}
        label="Parameters"
        value={parameters}
        checked={parameters}
        theme={theme}
      />
      <TagList />
      <NodeList />
      <UploadSnapshot />
    </div>
  </Scrollbars>
) : null;

const mapStateToProps = (state) => {
  return {
    nodes: getNodes(state),
    parameters: state.parameters,
    textLabels: state.textLabels,
    theme: state.theme,
    view: state.view
  };
};

const mapDispatchToProps = (dispatch) => ({
  onChangeView: (e, { value }) => {
    dispatch(changeView(value));
  },
  onToggleParameters: (e, { value }) => {
    dispatch(toggleParameters(value));
  },
  onToggleTextLabels: (e, { value }) => {
    dispatch(toggleTextLabels(Boolean(value)))
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(ChartUI);
