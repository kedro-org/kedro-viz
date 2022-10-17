import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { routes } from '../../routes.config';

export const useRedirectLocation = (onLoadNodeData) => {
  const { pathname, search } = useLocation();

  const isSelectedNodePath = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.selectedNode],
  });

  useEffect(() => {
    if (isSelectedNodePath) {
      const nodeId = search.split('_id=');

      onLoadNodeData(nodeId[1]);
    }
  }, [isSelectedNodePath, search, onLoadNodeData]);
};
