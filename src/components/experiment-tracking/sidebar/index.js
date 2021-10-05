import React from 'react';
import { connect } from 'react-redux';
import { Route } from 'react-router-dom';
import classnames from 'classnames';
import RunsList from '../runs-list';
import PrimaryToolbar from '../../primary-toolbar';
import './sidebar.css';

/**
 * Main runslist sidebar container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {boolean} props.visible Whether the sidebar is open/closed
 */
export const Sidebar = ({ visible }) => {
  return (
    <>
      <div
        className={classnames('pipeline-sidebar', {
          'pipeline-sidebar--visible': visible,
        })}
      >
        <div className="pipeline-ui">
          <Route path={['/runs/:id', '/runs']}>
            <RunsList />
          </Route>
        </div>
        <nav className="pipeline-toolbar">
          <PrimaryToolbar />
        </nav>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  visible: state.visible.sidebar,
});

export default connect(mapStateToProps)(Sidebar);
