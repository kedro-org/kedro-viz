import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useQuery } from '@apollo/client';
import classnames from 'classnames';
import MiniMap from '../minimap';
import MiniMapToolbar from '../minimap-toolbar';
import NodeList from '../node-list';
import PipelineList from '../pipeline-list';
import PrimaryToolbar from '../primary-toolbar';

import RunsList from '../experiment-tracking/runs-list';
import { GET_RUNS } from '../../apollo/queries';

import './sidebar.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {boolean} props.visible Whether the sidebar is open/closed
 */
export const Sidebar = ({
  enableComparisonView,
  isExperimentView = false,
  onRunSelection,
  onToggleComparison,
  visible,
}) => {
  const [pipelineIsOpen, togglePipeline] = useState(false);
  const { data } = useQuery(GET_RUNS, {
    skip: !isExperimentView,
  });

  if (isExperimentView) {
    return (
      <>
        <div
          className={classnames('pipeline-sidebar', {
            'pipeline-sidebar--visible': visible,
          })}
        >
          <div className="pipeline-ui">
            {data ? (
              <RunsList
                enableComparisonView={enableComparisonView}
                onRunSelection={onRunSelection}
                runData={data}
              />
            ) : null}
          </div>
          <nav className="pipeline-toolbar">
            <PrimaryToolbar
              enableComparisonView={enableComparisonView}
              isExperimentView
              onToggleComparison={onToggleComparison}
            />
          </nav>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div
          className={classnames('pipeline-sidebar', {
            'pipeline-sidebar--visible': visible,
          })}
        >
          <div className="pipeline-ui">
            <PipelineList onToggleOpen={togglePipeline} />
            <NodeList faded={pipelineIsOpen} />
          </div>
          <nav className="pipeline-toolbar">
            <PrimaryToolbar />
            <MiniMapToolbar />
          </nav>
          <MiniMap />
        </div>
      </>
    );
  }
};

const mapStateToProps = (state) => ({
  visible: state.visible.sidebar,
});

export default connect(mapStateToProps)(Sidebar);
