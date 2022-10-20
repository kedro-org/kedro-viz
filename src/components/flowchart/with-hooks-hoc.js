import React from 'react';
import { useGeneratePathname } from '../../utils/hooks/use-generate-pathname';

export const withHooksHOC = (Component) => {
  return (props) => {
    const {
      toFlowchartPage,
      toSelectedNode,
      toExpandedModularPipeline,
      toFocusedModularPipeline,
    } = useGeneratePathname();

    return (
      <Component
        toFlowchartPage={toFlowchartPage}
        toSelectedNode={toSelectedNode}
        toExpandedModularPipeline={toExpandedModularPipeline}
        toFocusedModularPipeline={toFocusedModularPipeline}
        {...props}
      />
    );
  };
};
