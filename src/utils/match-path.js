import { matchPath } from 'react-router-dom';
import { routes } from '../config';

export const findMatchedPath = (pathname, search) => {
  const matchedFlowchartMainPage = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.main],
  });

  const matchedSelectedPipeline = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.selectedPipeline],
  });

  const matchedSelectedNodeId = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.selectedNode],
  });

  const matchedSelectedNodeName = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.selectedName],
  });

  const matchedFocusedNode = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.focusedNode],
  });

  return {
    matchedFlowchartMainPage,
    matchedSelectedPipeline,
    matchedSelectedNodeId,
    matchedSelectedNodeName,
    matchedFocusedNode,
  };
};
