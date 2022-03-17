import React, { useState } from 'react';
import KedroViz from '@quantumblack/kedro-viz';
import spaceflights from '@quantumblack/kedro-viz/lib/utils/data/spaceflights.mock.json';
import demo from '@quantumblack/kedro-viz/lib/utils/data/demo.mock.json';
import getRandomData from '@quantumblack/kedro-viz/lib/utils/random-data';

export const dataSources = {
  spaceflights: () => spaceflights,
  demo: () => demo,
  random: () => getRandomData(),
};

const Radio = ({ current, value, onChange }) => (
  <label>
    <input
      type="radio"
      name="data"
      value={value}
      onChange={onChange}
      checked={value === current}
    />
    {value}
  </label>
);

const App = ({ initialData }) => {
  const initialDisplayValues = {
    globalToolbar: true,
    sidebar: true,
    minimap: true,
    expandAllPipelines: false,
  };

  const [displayValues, updateDisplayValue] = useState(initialDisplayValues);

  const [dataKey, updateDataKey] = useState(initialData);
  const onChange = (e) => updateDataKey(e.target.value);
  const onUpdateDisplayValue = (e) =>
    updateDisplayValue({
      ...displayValues,
      [e.target.value]: e.target.checked,
    });

  return (
    <div style={{ padding: 30, height: '80vh' }}>
      <h1>Kedro-Viz package import test</h1>
      <p>
        Data source:
        <Radio value="random" onChange={onChange} current={dataKey} />
        <Radio value="spaceflights" onChange={onChange} current={dataKey} />
        <Radio value="demo" onChange={onChange} current={dataKey} />
      </p>
      <div>
        Display:
        <input
          type="checkbox"
          id="globalToolbar"
          name="globalToolbar"
          value="globalToolbar"
          checked={displayValues.globalToolBar}
          onChange={onUpdateDisplayValue}
        />
        <label for="globalToolbar">Global ToolBar</label>
        <input
          type="checkbox"
          id="sidebar"
          name="sidebar"
          value="sidebar"
          checked={displayValues.sidebar}
          onChange={onUpdateDisplayValue}
        />
        <label for="sidebar">sidebar</label>
      </div>
      <KedroViz data={dataSources[dataKey]()} display={displayValues} />
    </div>
  );
};

App.defaultProps = {
  initialData: 'random',
};

export default App;
