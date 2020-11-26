import React, { useState } from 'react';
import KedroViz from '@quantumblack/kedro-viz';
import animals from '@quantumblack/kedro-viz/lib/utils/data/animals.mock.json';
import demo from '@quantumblack/kedro-viz/lib/utils/data/demo.mock.json';
import getRandomData from '@quantumblack/kedro-viz/lib/utils/random-data';

export const dataSources = {
  animals: () => animals,
  demo: () => demo,
  random: () => getRandomData()
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
  const [dataKey, updateDataKey] = useState(initialData);
  const onChange = e => updateDataKey(e.target.value);

  return (
    <div style={{ padding: 30, height: '80vh' }}>
      <h1>Kedro-Viz package import test</h1>
      <p>
        Data source:
        <Radio value="random" onChange={onChange} current={dataKey} />
        <Radio value="animals" onChange={onChange} current={dataKey} />
        <Radio value="demo" onChange={onChange} current={dataKey} />
      </p>
      <KedroViz data={dataSources[dataKey]()} />
    </div>
  );
};

App.defaultProps = {
  initialData: 'random'
};

export default App;
