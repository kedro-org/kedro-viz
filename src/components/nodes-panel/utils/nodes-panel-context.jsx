import React from 'react';
import { NodeListContextProvider } from './node-list-context';
import { FiltersContextProvider } from './filters-context';

export const NodesPanelContextProvider = ({ children }) => {
  return (
    <NodeListContextProvider>
      <FiltersContextProvider>{children}</FiltersContextProvider>
    </NodeListContextProvider>
  );
};
