import { useCallback } from 'react';
import { useHistory, generatePath } from 'react-router-dom';
import { routes } from '../../routes.config';
import { localStorageName } from '../../config';

export const useGeneratePathname = () => {
  const history = useHistory();

  const localStorage = window.localStorage.getItem(localStorageName);
  const localStorageData = JSON.parse(localStorage);

  const toFlowchartPage = useCallback(() => {
    const url = generatePath(routes.flowchart.main);
    history.push(url);
  }, [history]);

  const toSelectedNode = useCallback(
    (item) => {
      const url = generatePath(routes.flowchart.selectedNode, {
        id: item.id,
      });
      history.push(url);
    },
    [history]
  );

  const toExpandedModularPipeline = useCallback(
    (item) => {
      const url = generatePath(routes.flowchart.expandedNode, {
        expandedId: item.modularPipelines[0],
        id: item.id,
      });

      history.push(url);
    },
    [history]
  );

  const toFocusedModularPipeline = useCallback(
    (item) => {
      const url = generatePath(routes.flowchart.focusedNode, {
        id: item.id,
      });
      history.push(url);
    },
    [history]
  );

  return {
    toFlowchartPage,
    toSelectedNode,
    toExpandedModularPipeline,
    toFocusedModularPipeline,
  };
};
