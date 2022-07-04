import React from 'react';
import KedroViz from '@quantumblack/kedro-viz';

function VizComponent({ data }) {
  return (
    <div style={{ height: `90vh`, width: `100%` }}>
      <KedroViz
        data={data}
        display={{
          expandAllPipelines: false,
          globalToolbar: true,
          miniMap: false,
          sidebar: true,
        }}
        theme="dark"
      />
    </div>
  );
}

export default VizComponent;
