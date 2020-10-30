import React from 'react';
import ReactDOM from 'react-dom';
import 'what-input';
import App from './components/app';
import EasterEgg from './components/easter-egg';
import getPipelineData from './utils/data-source';
import './styles/index.css';

const KedroViz = () => (
  <>
    <App data={getPipelineData()} />
    <EasterEgg />
  </>
);

ReactDOM.render(<KedroViz />, document.getElementById('root'));
