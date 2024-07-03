import React, { useEffect } from 'react';
import App from '../app';
import getPipelineData from '../../utils/data-source';
import './container.scss';

/**
 * Top-level component for the use-case where Kedro-Viz is run as a standalone
 * app rather than imported as a library/package into a larger application.
 */
const Container = () => {
  const [tags, setTags] = React.useState({
    enabled: { companies: true },
  });
  const [nodeTypes, setNodeTypes] = React.useState({
    disabled: {
      parameters: false,
      task: false,
      data: false,
    },
  });
  const [theme, setTheme] = React.useState('dark');

  useEffect(() => {
    setTimeout(() => {
      setTags({
        enabled: { evaluate: true, companies: false },
      });
      setNodeTypes({
        disabled: {
          parameters: true,
          task: true,
          data: false,
        },
      });
      setTheme('light');
    }, 11000);
  }, [tags]);

  return (
    <>
      <App
        data={getPipelineData()}
        props={{
          display: {
            globalToolbar: false,
            miniMap: false,
            expandAllPipelines: false,
            sidebar: true,
          },
          tag: tags,
          nodeType: nodeTypes,
          theme: theme,
        }}
      />
    </>
  );
};

export default Container;
