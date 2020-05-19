import React from 'react';
import { connect } from 'react-redux';
import { toggleNodesDisabled } from '../../actions/nodes';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';

export const NodeListToggleAll = ({ onToggleNodesDisabled, nodeIDs }) => (
  <div className="kedro pipeline-nodelist__toggle">
    <h2 className="pipeline-nodelist__toggle__title">All Elements</h2>
    <div className="pipeline-nodelist__toggle__row">
      <button
        onClick={() => onToggleNodesDisabled(nodeIDs, false)}
        className="pipeline-nodelist__toggle__button">
        <VisibleIcon className="pipeline-nodelist__toggle__icon" />
        Show all
      </button>
      <button
        onClick={() => onToggleNodesDisabled(nodeIDs, true)}
        className="pipeline-nodelist__toggle__button">
        <InvisibleIcon className="pipeline-nodelist__toggle__icon" />
        Hide all
      </button>
    </div>
  </div>
);

export const mapDispatchToProps = dispatch => ({
  onToggleNodesDisabled: (nodeIDs, disabled) => {
    dispatch(toggleNodesDisabled(nodeIDs, disabled));
  }
});

export default connect(
  null,
  mapDispatchToProps
)(NodeListToggleAll);
