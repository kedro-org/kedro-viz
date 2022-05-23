import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { getVisibleNodes } from '../../selectors/nodes';
import './empty-pipeline-warning.css';

export const EmptyPipelineWarning = ({ nodes, sidebarVisible }) => {
  const emptyPipeline = nodes.length === 0;
  return emptyPipeline ? (
    <div
      className={classnames('kedro', 'pipeline-warning', {
        'pipeline-warning--sidebar-visible': sidebarVisible,
      })}
    >
      <h2 className="pipeline-warning__title">
        Oops, there's nothing to see here
      </h2>
      <p className="pipeline-warning__subtitle">
        This selection has nothing. Please unselect your filters or modular
        pipeline selection to see pipeline elements.
      </p>
    </div>
  ) : null;
};

export const mapStateToProps = (state) => ({
  theme: state.theme,
  sidebarVisible: state.visible.sidebar,
  nodes: getVisibleNodes(state),
});

export default connect(mapStateToProps)(EmptyPipelineWarning);
