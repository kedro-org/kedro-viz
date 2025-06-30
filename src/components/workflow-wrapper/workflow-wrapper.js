import { useEffect } from 'react';
import { connect } from 'react-redux';

import { setView } from '../../actions';
import { VIEW } from '../../config';
import { isRunStatusAvailable } from '../../selectors/run-status';
import Workflow from '../workflow/workflow';
import RunNotFoundWarning from '../run-not-found-warning/run-not-found-warning';

/**
 * Main workflow container. Handles showing/hiding run status and no data messages
 * as well as the display of all related modals.
 */
export const WorkflowWrapper = ({ onSetView, isRunStatusAvailable }) => {
  useEffect(() => {
    onSetView(VIEW.WORKFLOW);
  }, [onSetView]);

  return <>{isRunStatusAvailable ? <Workflow /> : <RunNotFoundWarning />}</>;
};

export const mapStateToProps = (state) => ({
  isRunStatusAvailable: isRunStatusAvailable(state),
});

export const mapDispatchToProps = (dispatch) => ({
  onSetView: (view) => dispatch(setView(view)),
});

export default connect(mapStateToProps, mapDispatchToProps)(WorkflowWrapper);
