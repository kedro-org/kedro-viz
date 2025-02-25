import { matchPath } from 'react-router-dom';
import { params, routes } from '../config';

export const findMatchedPath = (pathname, search) => {
  const matchedFlowchartMainPage = matchPath(pathname + search, {
    exact: false,
    path: [routes.flowchart.main],
  });

  const isQueryParamExist = (queryParam, queryString) => {
    const searchParams = new URLSearchParams(queryString);
    return searchParams.has(queryParam);
  };

  const hasQueryParam = (param) => {
    const hasPipelineId = isQueryParamExist(params.pipeline, search);
    const hasParam = isQueryParamExist(param, search);
    return param ? hasPipelineId && hasParam : hasPipelineId;
  };

  const matchedSelectedPipeline = () => hasQueryParam();
  const matchedSelectedNodeId = () => hasQueryParam(params.selected);
  const matchedSelectedNodeName = () => hasQueryParam(params.selectedName);
  const matchedFocusedNode = () => hasQueryParam(params.focused);

  return {
    matchedFlowchartMainPage,
    matchedSelectedPipeline,
    matchedSelectedNodeId,
    matchedSelectedNodeName,
    matchedFocusedNode,
  };
};
