import React from 'react';
import NodesPanel from './nodes-panel';

import { NodesPanelContextProvider } from './utils/nodes-panel-context';

/**
 * Acts as a wrapper component that provides the AppContext to the NodesPanel component.
 * This ensures that NodesPanel has access to the necessary context values and functions.
 */
const NodesPanelProvider = ({ faded, visible = true }) => {
  return (
    <NodesPanelContextProvider>
      <NodesPanel visible={visible} faded={faded} />
    </NodesPanelContextProvider>
  );
};

export default NodesPanelProvider;
