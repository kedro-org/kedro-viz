import React from 'react';
import ReactDOM from 'react-dom';
import 'what-input';
import App from './components/app';
import EasterEgg from './components/easter-egg';
import getDataSource from './utils/data-source';
import './styles/index.css';

ReactDOM.render(
  <>
    <App data={getDataSource()} />
    <EasterEgg />
  </>,
  document.getElementById('root')
);
