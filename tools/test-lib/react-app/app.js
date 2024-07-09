import React, { useState } from 'react';
import KedroViz from '@quantumblack/kedro-viz';
import VizComponent from './VizComponent';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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

const App = ({ initialData = 'random' }) => {
  const [dataKey, updateDataKey] = useState(initialData);
  const onChange = (e) => updateDataKey(e.target.value);

  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/users">/users</Link> (Kedro-Viz demo here)
            </li>
            <li>
              <Link to="/about/">/about/</Link> (Kedro-Viz demo here)
            </li>
          </ul>
        </nav>

        <Routes>
          <Route
            element={<VizComponent data={spaceflights} />}
            path="/users"
          ></Route>
          <Route element={<VizComponent data={demo} />} path="/about/"></Route>
          <Route
            element={
              <div style={{ padding: 30, height: '80vh' }}>
                <h1>Kedro-Viz package import test</h1>
                <p>
                  Data source:
                  <Radio value="random" onChange={onChange} current={dataKey} />
                  <Radio
                    value="spaceflights"
                    onChange={onChange}
                    current={dataKey}
                  />
                  <Radio value="demo" onChange={onChange} current={dataKey} />
                </p>
                <KedroViz data={dataSources[dataKey]()} />
              </div>
            }
            path="/"
          ></Route>
        </Routes>
      </div>
    </Router>
  );
};

export default App;
