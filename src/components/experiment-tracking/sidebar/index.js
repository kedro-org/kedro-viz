import React from 'react';
import { connect } from 'react-redux';
import { useQuery } from '@apollo/client';
import classnames from 'classnames';
import RunsList from '../runs-list';
import PrimaryToolbar from '../../primary-toolbar';
import { GET_RUNS } from '../../../apollo/queries';
import './sidebar.css';

/**
 * Main runslist sidebar container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {array} props.data The RunsList data
 * @param {boolean} props.visible Whether the sidebar is open/closed
 */
export const Sidebar = ({ onRunSelection, visible }) => {
  const { data } = useQuery(GET_RUNS);

  if (data) {
    return (
      <>
        <div
          className={classnames('pipeline-sidebar', {
            'pipeline-sidebar--visible': visible,
          })}
        >
          <div className="pipeline-ui">
            <RunsList onRunSelection={onRunSelection} runData={data} />
          </div>
          <nav className="pipeline-toolbar">
            <PrimaryToolbar />
          </nav>
        </div>
      </>
    );
  }

  return null;
};

const mapStateToProps = (state) => ({
  visible: state.visible.sidebar,
});

export default connect(mapStateToProps)(Sidebar);
