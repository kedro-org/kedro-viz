import React from 'react';
import { useGeneratePathname } from '../../utils/hooks/use-generate-pathname';

export const withHooksHOC = (Component) => {
  return (props) => {
    const { toFlowchartPage, toSelectedNode, toFocusedModularPipeline } =
      useGeneratePathname();

    return (
      <Component
        toFlowchartPage={toFlowchartPage}
        toSelectedNode={toSelectedNode}
        toFocusedModularPipeline={toFocusedModularPipeline}
        {...props}
      />
    );
  };
};
