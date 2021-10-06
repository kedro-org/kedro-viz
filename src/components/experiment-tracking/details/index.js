import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { useQuery } from '../../../utils';
import './details.css';

/**
 * Main experiment tracking page container. Handles showing/hiding the sidebar nav for experiment tracking,
 * the display of experiment details, as well as the comparison view.
 */
const Details = ({ sidebarVisible }) => {
  const query = useQuery();

  const run = query.get('run');
  const compare = query.get('compare');
  const compareList = typeof compare === 'string' ? compare.split(' ') : null;

  // the following are only placeholders to indicate routing intent and should be
  // deleted on building the actual implementation of the runsList
  return (
    <div
      className={classnames('kedro', 'details-mainframe', {
        'details-mainframe--sidebar-visible': sidebarVisible,
      })}
    >
      <h1>
        {run !== null
          ? 'Single view details'
          : compare !== null
          ? 'Compare view details'
          : 'No runs'}
      </h1>
      {run !== null && <h2>Details of Run {run}</h2>}
      {compareList !== null &&
        compareList.map((run, i) => <h2 key={i}>details of Run {run}</h2>)}
    </div>
  );
};

export const mapStateToProps = (state) => ({
  sidebarVisible: state.visible.sidebar,
});

export default connect(mapStateToProps)(Details);
