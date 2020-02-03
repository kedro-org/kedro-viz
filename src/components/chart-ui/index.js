import React from 'react';
import { connect } from 'react-redux';
import RadioButton from '@quantumblack/kedro-ui/lib/components/radio-button';
import Toggle from '@quantumblack/kedro-ui/lib/components/toggle';
import { changeView, toggleParameters } from '../../actions';
import TagList from '../tag-list';
import NodeList from '../node-list';
import './chart-ui.css';
import { Scrollbars } from 'react-custom-scrollbars';

/**
 * Main contols for filtering the chart data
 * @param {Boolean} hasData Whether the chart data has been loaded
 * @param {Function} onToggleParameters Handle toggling parameters on/off
 * @param {Function} onToggleTextLabels Handle toggling text labels on/off
 * @param {Function} onChangeView Handle changing view between combined/task/data
 * @param {Boolean} parameters Whether parameters are displayed
 * @param {Boolean} textLabels Whether text labels are displayed
 * @param {string} theme Kedro UI light/dark theme
 * @param {string} view Which node types are displayed: combined/task/data
 */
export const ChartUI = ({
  hasData,
  onToggleParameters,
  onChangeView,
  parameters,
  theme,
  view
}) =>
  hasData ? (
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
          onChange={onToggleParameters}
          label="Parameters"
          value={parameters}
          checked={parameters}
          theme={theme}
        />
        <TagList />
        <NodeList />
      </div>
    </Scrollbars>
  ) : null;

export const mapStateToProps = state => ({
  hasData: Boolean(state.nodes.length),
  parameters: state.parameters,
  theme: state.theme,
  view: state.view
});

export const mapDispatchToProps = dispatch => ({
  onChangeView: (e, { value }) => {
    dispatch(changeView(value));
  },
  onToggleParameters: (e, { value }) => {
    dispatch(toggleParameters(value));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChartUI);
