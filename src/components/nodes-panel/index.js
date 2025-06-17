import React from 'react';
import NodesPanel from './nodes-panel';

import { NodesPanelContextProvider } from './utils/nodes-panel-context';

/**
 * Acts as a wrapper component that provides the AppContext to the NodesPanel component.
 * This ensures that NodesPanel has access to the necessary context values and functions.
 */
const NodesPanelProvider = ({
  faded,
  isRunStatusAvailable,
  isWorkflowView,
}) => {
  return (
    <NodesPanelContextProvider>
      <NodesPanel
        isRunStatusAvailable={isRunStatusAvailable}
        isWorkflowView={isWorkflowView}
        faded={faded}
      />
    </NodesPanelContextProvider>
  );
};

export default NodesPanelProvider;
