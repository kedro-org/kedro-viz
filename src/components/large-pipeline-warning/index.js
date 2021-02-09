import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { toggleDisplayLargeGraph } from '../../actions/graph';
import { getGroupedNodes } from '../../selectors/nodes';
import './large-pipeline-warning.css';

export const LargePipelineWarning = ({
  theme,
  nodes,
  onToggleDisplayLargeGraph
}) => {
  return (
    <div
      className={classnames('pipeline-warning', {
        'kui-theme--dark': theme === 'dark',
        'kui-theme--light': theme === 'light'
      })}>
      <div className="pipeline-warning__title">Your pipeline is large.</div>
      <div className="pipeline-warning__subtitle">
        Your pipeline might take a while to render because it has{' '}
        <b>{nodes.data.length + nodes.parameters.length + nodes.task.length}</b>{' '}
        nodes. Use the sidebar controls to select a smaller graph, or click to
        render.
      </div>
      <button
        className={classnames('pipeline-warning__btn', {
          'kui-theme--dark': theme === 'dark',
          'kui-theme--light': theme === 'light'
        })}
        onClick={() => onToggleDisplayLargeGraph(true)}>
        Render it anyway
      </button>
    </div>
  );
};

export const mapStateToProps = state => ({
  theme: state.theme,
  nodes: getGroupedNodes(state)
});

export const mapDispatchToProps = dispatch => ({
  onToggleDisplayLargeGraph: value => {
    dispatch(toggleDisplayLargeGraph(value));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LargePipelineWarning);
