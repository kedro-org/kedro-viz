import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { toggleIgnoreLargeWarning } from '../../actions';
import { getVisibleNodes } from '../../selectors/nodes';
import { getTriggerLargeGraphWarning } from '../../selectors/layout';
import Button from '@quantumblack/kedro-ui/lib/components/button';
import './large-pipeline-warning.css';

export const LargePipelineWarning = ({
  theme,
  nodes,
  onToggleIgnoreLargeWarning,
  sidebarVisible,
  visible,
}) => {
  return visible ? (
    <div
      className={classnames('kedro', 'pipeline-warning', {
        'pipeline-warning--sidebar-visible': sidebarVisible,
      })}>
      <h2 className="pipeline-warning__title">
        Whoa, that’s a chonky pipeline!
      </h2>
      <p className="pipeline-warning__subtitle">
        This graph contains <b>{nodes.length}</b> elements, which will take a
        while to render. You can use the sidebar controls to select a smaller
        graph.
      </p>
      <Button theme={theme} onClick={() => onToggleIgnoreLargeWarning(true)}>
        Render it anyway
      </Button>
    </div>
  ) : null;
};

export const mapStateToProps = (state) => ({
  theme: state.theme,
  sidebarVisible: state.visible.sidebar,
  nodes: getVisibleNodes(state),
  visible: getTriggerLargeGraphWarning(state),
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleIgnoreLargeWarning: (value) => {
    dispatch(toggleIgnoreLargeWarning(value));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LargePipelineWarning);
