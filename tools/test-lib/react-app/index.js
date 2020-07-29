import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  return (
    <div style={{ padding: 50, height: '80vh' }}>
      <h1>Hello, world!</h1>
    </div>
  );
}

const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.render(<App />, root);
