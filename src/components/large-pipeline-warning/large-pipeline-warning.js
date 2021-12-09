import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { changeFlag, toggleIgnoreLargeWarning } from '../../actions';
import { getVisibleNodes } from '../../selectors/nodes';
import { getTriggerLargeGraphWarning } from '../../selectors/layout';
import Button from '@quantumblack/kedro-ui/lib/components/button';
import './large-pipeline-warning.css';

export const LargePipelineWarning = ({
  onDisable,
  onHide,
  nodes,
  sidebarVisible,
  theme,
  visible,
}) => {
  return visible ? (
    <div
      className={classnames('kedro', 'pipeline-warning', {
        'pipeline-warning--sidebar-visible': sidebarVisible,
      })}
    >
      <h2 className="pipeline-warning__title">
        Whoa, that’s a chonky pipeline!
      </h2>
      <p className="pipeline-warning__subtitle">
        This graph contains <b>{nodes.length}</b> elements, which will take a
        while to render. You can use the sidebar controls to select a smaller
        graph.
      </p>
      <Button theme={theme} onClick={onHide}>
        Render it anyway
      </Button>
      <Button
        theme={theme}
        onClick={onDisable}
        size="small"
        mode="secondary"
        animation="wipe"
      >
        Don't show this again
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
  onDisable: () => {
    dispatch(changeFlag('sizewarning', false));
  },
  onHide: () => {
    dispatch(toggleIgnoreLargeWarning(true));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LargePipelineWarning);
