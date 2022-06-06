import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { changeFlag, toggleIgnoreLargeWarning } from '../../actions';
import { getVisibleNodes } from '../../selectors/nodes';
import { getTriggerLargeGraphWarning } from '../../selectors/layout';
import Button from '../ui/button';
import './pipeline-warning.css';

export const PipelineWarning = ({
  nodes,
  onDisable,
  onHide,
  sidebarVisible,
  visible,
}) => {
  const [componentLoaded, setComponentLoaded] = useState(false);
  const isEmptyPipeline = nodes.length === 0;

  // Only run this once, when the component mounts
  useEffect(() => {
    if (nodes.length > 0) {
      setComponentLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {visible && (
        <div
          className={classnames('kedro', 'pipeline-warning', {
            'pipeline-warning--sidebar-visible': sidebarVisible,
          })}
        >
          <h2 className="pipeline-warning__title">
            Whoa, that’s a chonky pipeline!
          </h2>
          <p className="pipeline-warning__subtitle">
            This graph contains <b>{nodes.length}</b> elements, which will take
            a while to render. You can use the sidebar controls to select a
            smaller graph.
          </p>
          <Button onClick={onHide}>Render it anyway</Button>
          <Button mode="secondary" onClick={onDisable} size="small">
            Don't show this again
          </Button>
        </div>
      )}
      {isEmptyPipeline && (
        <div
          className={classnames('kedro', {
            'pipeline-warning': componentLoaded,
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
      )}
    </>
  );
};

export const mapStateToProps = (state) => ({
  nodes: getVisibleNodes(state),
  sidebarVisible: state.visible.sidebar,
  theme: state.theme,
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

export default connect(mapStateToProps, mapDispatchToProps)(PipelineWarning);
