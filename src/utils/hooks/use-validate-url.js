import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { params } from '../../config';

const messages = {
  node: 'Invalid node ID',
  modularPipeline: 'Invalid modular pipeline ID',
  pipeline: 'Invalid pipeline ID',
};

export const useValidateUrl = (modularPipelinesTree, reload) => {
  const [errorMessage, setErrorMessage] = useState({});
  const [invalidUrl, setInvalidUrl] = useState(false);

  const { pathname, search } = useLocation();

  useEffect(() => {
    setInvalidUrl(false);

    const activePipelineId = search.substring(
      search.indexOf(params.pipeline) + params.pipeline.length,
      search.indexOf('&')
    );
    const nodeId = search.split(params.selected)[1];
    const modularPipelineId = search.split(params.focused)[1];

    const fetchPipelines = async () => {
      try {
        await fetch(`${pathname}api/pipelines/${activePipelineId}`)
          .then((response) => response.json())
          .then((data) => {
            if (data.message.includes(messages.pipeline)) {
              setErrorMessage(messages.pipeline);
              setInvalidUrl(true);
            }
          });
      } catch (err) {}
    };
    fetchPipelines();

    if (nodeId) {
      const fetchNodes = async () => {
        try {
          await fetch(`${pathname}api/nodes/${nodeId}`)
            .then((response) => response.json())
            .then((data) => {
              if (data.message.includes(messages.node)) {
                setErrorMessage(messages.node);
                setInvalidUrl(true);
              }
            });
        } catch (err) {
          console.log(err);
        }
      };
      fetchNodes();
    }

    // Modular Pipeline does not have an end point
    // so we can't fetch API to get the error message back
    if (modularPipelineId) {
      const existedModularPipeline = modularPipelinesTree[modularPipelineId];
      if (!existedModularPipeline) {
        setErrorMessage(messages.modularPipeline);
        setInvalidUrl(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, search]);

  return { errorMessage, invalidUrl };
};
