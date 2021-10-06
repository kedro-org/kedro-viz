import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Sidebar from '../experiment-tracking/sidebar';
import Details from '../experiment-tracking/details';

/**
 * Main experiment tracking page container. Handles showing/hiding the sidebar nav for experiment tracking,
 * the display of experiment details single / comparison view.
 */
const ExperimentWrapper = () => (
  <div>
    <Sidebar />
    <div>
      <Switch>
        <Route path={['/runsList/:id', '/runsList']}>
          <Details />
        </Route>
      </Switch>
    </div>
  </div>
);

export default ExperimentWrapper;
