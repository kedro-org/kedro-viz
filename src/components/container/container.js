import React from 'react';
import App from '../app';
import getPipelineData from '../../utils/data-source';
import './container.scss';

/**
 * Top-level component for the use-case where Kedro-Viz is run as a standalone
 * app rather than imported as a library/package into a larger application.
 */
const Container = () => {
  // const [tags, setTags] = React.useState({
  //   enabled: { companies: true, shuttles: true },
  // });
  // const [nodeTypes, setNodeTypes] = React.useState({
  //   disabled: {
  //     parameters: false,
  //     task: false,
  //     data: false,
  //   },
  // });
  // const [theme, setTheme] = React.useState('dark');

  // useEffect(() => {
  //   setTimeout(() => {
  //     setTags({
  //       enabled: { evaluate: true, companies: false },
  //     });
  //     setNodeTypes({
  //       disabled: {
  //         parameters: true,
  //         task: true,
  //         data: false,
  //       },
  //     });
  //     setTheme('light');
  //   }, 10000);
  // }, [theme, tags, nodeTypes]);

  return (
    <>
      <App
        data={getPipelineData()}
        options={{
          display: {
            globalToolbar: false,
            miniMap: true,
            expandAllPipelines: true,
            sidebar: true,
            filterBtn: true,
          },
        }}
      />
    </>
  );
};

export default Container;
