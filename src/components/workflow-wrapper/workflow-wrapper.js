import { useEffect } from 'react';
import { connect } from 'react-redux';

import { setView } from '../../actions';
import { VIEW } from '../../config';
import Workflow from '../workflow/workflow';

/**
 * Main workflow container. Handles showing/hiding run status and no data messages
 * as well as the display of all related modals.
 */
export const WorkflowWrapper = ({ onSetView }) => {
  useEffect(() => {
    onSetView(VIEW.WORKFLOW);
  }, [onSetView]);

  return <Workflow />;
};

export const mapDispatchToProps = (dispatch) => ({
  onSetView: (view) => dispatch(setView(view)),
});

export default connect(null, mapDispatchToProps)(WorkflowWrapper);
