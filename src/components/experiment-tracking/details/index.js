import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import './details.css';

/**
 * Main experiment tracking page container. Handles showing/hiding the sidebar nav for experiment tracking,
 * the display of experiment details, as well as the comparison view.
 */
const Details = ({ sidebarVisible }) => {
  let { id } = useParams();

  return (
    <>
      <div
        className={classnames('kedro', 'details-mainframe', {
          'details-mainframe--sidebar-visible': sidebarVisible,
        })}
      >
        <h1>
          {typeof id !== 'undefined'
            ? `This displays the details of run ${id}`
            : 'No selected Run'}
        </h1>
      </div>
    </>
  );
};

export const mapStateToProps = (state) => ({
  sidebarVisible: state.visible.sidebar,
});

export default connect(mapStateToProps)(Details);
