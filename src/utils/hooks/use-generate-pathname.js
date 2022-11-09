import { useCallback } from 'react';
import { useHistory, generatePath } from 'react-router-dom';
import { localStorageName, routes } from '../../config';

const getCurrentActivePipeline = () => {
  const localStorage = window.localStorage.getItem(localStorageName);
  return JSON.parse(localStorage)?.pipeline?.active;
};

/**
 * To generate different pathnames based on each action
 * E.g.: click on a node, or focus on a modular pipeline
 * or to reset the pathname to the main page
 */
export const useGeneratePathname = () => {
  const history = useHistory();

  const toFlowchartPage = useCallback(() => {
    const url = generatePath(routes.flowchart.main);
    history.push(url);
  }, [history]);

  const toSelectedNode = useCallback(
    (item) => {
      const activePipeline = getCurrentActivePipeline();

      const url = generatePath(routes.flowchart.selectedNode, {
        pipelineId: activePipeline,
        id: item.id,
      });
      history.push(url);
    },
    [history]
  );

  const toFocusedModularPipeline = useCallback(
    (item) => {
      const activePipeline = getCurrentActivePipeline();

      const url = generatePath(routes.flowchart.focusedNode, {
        pipelineId: activePipeline,
        id: item.id,
      });
      history.push(url);
    },
    [history]
  );

  return {
    toFlowchartPage,
    toSelectedNode,
    toFocusedModularPipeline,
  };
};
