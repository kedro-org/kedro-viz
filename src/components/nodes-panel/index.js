import React from 'react';
import NodesPanel from './nodes-panel';

import { AppContextProvider } from './utils/app-context';

import './styles/node-list.scss';

/**
 * Acts as a wrapper component that provides the AppContext to the NodesPanel component.
 * This ensures that NodesPanel has access to the necessary context values and functions.
 */
const NodesPanelProvider = ({ faded }) => {
  return (
    <AppContextProvider>
      <NodesPanel faded={faded} />
    </AppContextProvider>
  );
};

export default NodesPanelProvider;
