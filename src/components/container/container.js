import React, { useEffect } from 'react';
import App from '../app';
import getPipelineData from '../../utils/data-source';
import './container.scss';

/**
 * Top-level component for the use-case where Kedro-Viz is run as a standalone
 * app rather than imported as a library/package into a larger application.
 */
const Container = () => {
  const [tags, setTags] = React.useState(['companies']);
  const [nodeTypes, setNodeTypes] = React.useState(['parameters']);

  useEffect(() => {
    setTimeout(() => {
      setTags(['evaluate', 'shuttles']);
      setNodeTypes(['task', 'data']);
    }, 15000);
  }, [tags]);

  return (
    <>
      <App data={getPipelineData()} tags={tags} nodeTypes={nodeTypes} />
    </>
  );
};

export default Container;
