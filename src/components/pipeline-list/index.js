import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import Dropdown from '@quantumblack/kedro-ui/lib/components/dropdown';
import MenuOption from '@quantumblack/kedro-ui/lib/components/menu-option';
import { loadPipelineData } from '../../actions/pipelines';
import { toggleFocusMode } from '../../actions';
import './pipeline-list.css';

/**
 * A Dropdown displaying a list of selectable pipelines
 * @param {Object} pipeline Pipeline IDs, names, and active pipeline
 * @param {Function} onUpdateActivePipeline Handle updating the active pipeline
 * @param {Function} onToggleOpen Callback when opening/closing the dropdown
 * @param {string} theme Kedro UI light/dark theme
 */
export const PipelineList = ({
  asyncDataSource,
  onUpdateActivePipeline,
  pipeline,
  prettyName,
  theme,
  onToggleOpen,
}) => {
  if (!pipeline.ids.length && !asyncDataSource) {
    return null;
  }
  return (
    <div className="pipeline-list">
      <Dropdown
        disabled={!pipeline.ids.length}
        onOpened={() => onToggleOpen(true)}
        onClosed={() => onToggleOpen(false)}
        theme={theme}
        width={null}
        onChanged={onUpdateActivePipeline}
        defaultText={
          prettyName
            ? pipeline.name[pipeline.active]
            : pipeline.active || 'Default'
        }>
        {pipeline.ids.map((id) => (
          <MenuOption
            key={`pipeline-${id}`}
            className={classnames({
              'pipeline-list__option--active': pipeline.active === id,
            })}
            value={id}
            primaryText={prettyName ? pipeline.name[id] : id}
          />
        ))}
      </Dropdown>
    </div>
  );
};

export const mapStateToProps = (state) => ({
  asyncDataSource: state.dataSource === 'json',
  pipeline: state.pipeline,
  prettyName: state.prettyName,
  theme: state.theme,
});

export const mapDispatchToProps = (dispatch) => ({
  onUpdateActivePipeline: (event) => {
    dispatch(loadPipelineData(event.value));
    dispatch(toggleFocusMode(null));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(PipelineList);
