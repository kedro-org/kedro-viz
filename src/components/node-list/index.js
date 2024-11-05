import React from 'react';
import NodeList from './node-list';

import { AppContextProvider } from './utils/app-context';

import './styles/node-list.scss';

/**
 * Acts as a wrapper component that provides the AppContext to the NodeList component.
 * This ensures that NodeList has access to the necessary context values and functions.
 */
const NodeListProvider = ({ faded }) => {
  return (
    <AppContextProvider>
      <NodeList faded={faded} />
    </AppContextProvider>
  );
};

export default NodeListProvider;
