import { useCallback } from 'react';
import { useHistory, generatePath } from 'react-router-dom';
import { routes } from '../../routes.config';

export const useGeneratePathname = () => {
  const history = useHistory();

  const toFlowchartPage = useCallback(() => {
    const url = generatePath(routes.flowchart.main);
    history.push(url);
  }, [history]);

  return { toFlowchartPage };
};
