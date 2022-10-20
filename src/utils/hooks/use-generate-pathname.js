import { useCallback } from 'react';
import { useHistory, generatePath } from 'react-router-dom';
import { routes } from '../../routes.config';
import { localStorageName } from '../../config';

/**
 * To generate different pathnames based on each action
 * E.g.: click on a node, or focus on a modular pipeline
 * or to reset the pathname to the main page
 */
export const useGeneratePathname = () => {
  const history = useHistory();

  const localStorage = window.localStorage.getItem(localStorageName);
  const activePipeline = JSON.parse(localStorage)?.pipeline?.active;

  const toFlowchartPage = useCallback(() => {
    const url = generatePath(routes.flowchart.main);
    history.push(url);
  }, [history]);

  const toSelectedNode = useCallback(
    (item) => {
      const url = generatePath(routes.flowchart.selectedNode, {
        pipelineId: activePipeline,
        id: item.id,
      });
      history.push(url);
    },
    [history, activePipeline]
  );

  const toFocusedModularPipeline = useCallback(
    (item) => {
      const url = generatePath(routes.flowchart.focusedNode, {
        pipelineId: activePipeline,
        id: item.id,
      });
      history.push(url);
    },
    [history, activePipeline]
  );

  return {
    toFlowchartPage,
    toSelectedNode,
    toFocusedModularPipeline,
  };
};
