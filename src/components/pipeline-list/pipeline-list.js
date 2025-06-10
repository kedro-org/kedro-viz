import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import Dropdown from '../ui/dropdown';
import MenuOption from '../ui/menu-option';
import { loadPipelineData } from '../../actions/pipelines';
import { toggleFocusMode } from '../../actions';
import { useGeneratePathname } from '../../utils/hooks/use-generate-pathname';
import './pipeline-list.scss';
import { VIEW } from '../../config';

/**
 * A Dropdown displaying a list of selectable pipelines
 * @param {Object} pipeline Pipeline IDs, names, and active pipeline
 * @param {Function} onUpdateActivePipeline Handle updating the active pipeline
 * @param {Function} onToggleOpen Callback when opening/closing the dropdown
 */
export const PipelineList = ({
  asyncDataSource,
  onUpdateActivePipeline,
  pipeline,
  isPrettyName,
  onToggleOpen,
  isWorkflowView,
}) => {
  const { toSelectedPipeline } = useGeneratePathname();
  const isWorkflowView = view === VIEW.WORKFLOW;

  if (!pipeline.ids.length && !asyncDataSource) {
    return null;
  }
  return (
    <div className="pipeline-list">
      <Dropdown
        disabled={isWorkflowView || !pipeline.ids.length}
        onOpened={() => onToggleOpen(true)}
        onClosed={() => onToggleOpen(false)}
        width={null}
        dataTest={'kedro-pipeline-selector'}
        onChanged={(selectedPipeline) => {
          onUpdateActivePipeline(selectedPipeline);
          // Reset the URL to the current active pipeline when switching between different view
          toSelectedPipeline(selectedPipeline.value);
        }}
        defaultText={
          isPrettyName
            ? pipeline.name[pipeline.active]
            : pipeline.active || 'Default'
        }
      >
        {pipeline.ids.map((id) => (
          <MenuOption
            key={`pipeline-${id}`}
            className={classnames({
              'pipeline-list__option--active': pipeline.active === id,
            })}
            value={id}
            primaryText={isPrettyName ? pipeline.name[id] : id}
          />
        ))}
      </Dropdown>
    </div>
  );
};

export const mapStateToProps = (state) => ({
  asyncDataSource: state.dataSource === 'json',
  pipeline: state.pipeline,
  isPrettyName: state.isPrettyName,
  view: state.view,
});

export const mapDispatchToProps = (dispatch) => ({
  onUpdateActivePipeline: (event) => {
    dispatch(loadPipelineData(event.value));
    dispatch(toggleFocusMode(null));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(PipelineList);
