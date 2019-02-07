import React from 'react';
import { connect } from 'react-redux';
import {
  Checkbox,
  Dropdown,
  RadioButton,
  Toggle,
} from '@quantumblack/carbon-ui-components';
import {
  changeView,
  toggleParameters,
  toggleTag,
  toggleTextLabels
} from '../../actions';
import { getActivePipelineData, getTags } from '../../selectors';
import NodeList from '../node-list';
import UploadSnapshot from '../upload-snapshot';
import './chart-ui.scss';
import { Scrollbars } from 'react-custom-scrollbars';

const ChartUI = ({
  allowUploads,
  activePipelineData,
  onToggleParameters,
  onToggleTextLabels,
  onToggleTag,
  onChangeView,
  parameters,
  tags,
  tagLabel,
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
      <Dropdown
        theme={theme}
        width={null}
        defaultText={tagLabel}>
        <React.Fragment>
          <ul className="pipeline-ui__tag-list">
            { tags.map(tag => (
              <li
                key={`tag-${tag.id}`}
                className="pipeline-ui__tag-list-item cbn-menu-option">
                <Checkbox
                  checked={!tag.disabled}
                  label={<span>{tag.name}</span>}
                  name={tag.id}
                  onChange={onToggleTag(tag.id)}
                  theme={theme} />
              </li>
            )) }
          </ul>
        </React.Fragment>
      </Dropdown>
      { activePipelineData.nodes && (
        <NodeList />
      ) }
      <UploadSnapshot
        allowUploads={allowUploads}
        data={activePipelineData}
        theme={theme} />
    </div>
  </Scrollbars>
) : null;

/**
 * Generate the label for the tag dropdown
 * @param {Array} tags List of tag objects
 * @return {string} Label text
 */
const getTagLabel = tags => {
  const totalTabCount = tags.length;
  const activeTabCount = tags.filter(d => !d.disabled).length;
  const tagCount = activeTabCount < totalTabCount ? `${activeTabCount}/${totalTabCount}` : 'all';
  return `Tags (${tagCount})`;
}

const mapStateToProps = (state) => {
  const tags = getTags(state);
  return {
    activePipelineData: getActivePipelineData(state),
    allowUploads: state.allowUploads,
    parameters: state.parameters,
    tags,
    tagLabel: getTagLabel(tags),
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
  onToggleTag: tagID => (e, { checked }) => {
    dispatch(toggleTag(tagID, !checked));
  },
  onToggleTextLabels: (e, { value }) => {
    dispatch(toggleTextLabels(Boolean(value)))
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(ChartUI);
