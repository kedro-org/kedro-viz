import React from 'react';
import ReactDOM from 'react-dom';
import KedroViz from '@quantumblack/kedro-viz';
import getRandomData from '@quantumblack/kedro-viz/lib/utils/random-data';

function App() {
  return (
    <div style={{ padding: 50, height: '80vh' }}>
      <h1>Hello, world!</h1>
      <KedroViz data={getRandomData()} />
    </div>
  );
}

const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.render(<App />, root);
