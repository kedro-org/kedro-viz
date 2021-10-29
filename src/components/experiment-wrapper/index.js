import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Sidebar from '../experiment-tracking/sidebar';
import Details from '../experiment-tracking/details';
import { Provider } from '../provider/provider';

/**
 * Main experiment tracking page container. Handles showing/hiding the sidebar
 * nav for experiment tracking and the display of the experiment details
 * single / comparison view.
 */
const ExperimentWrapper = () => (
  <>
    <Provider useMocks={true}>
      <Sidebar />
      <Switch>
        <Route path={['/runsList/:id', '/runsList']}>
          <Details />
        </Route>
      </Switch>
    </Provider>
  </>
);

export default ExperimentWrapper;
