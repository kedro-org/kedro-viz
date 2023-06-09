import { matchPath } from 'react-router-dom';
import { routes } from '../config';

export const findMatchedPath = (pathname, search) => {
  // find match path
  const matchedFlowchartMainPage = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.main],
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
    matchedSelectedNodeId,
    matchedSelectedNodeName,
    matchedFocusedNode,
  };
};
