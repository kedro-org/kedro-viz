import React from 'react';
import ReactDOM from 'react-dom';
import 'what-input';
import App from './components/app';
import EasterEgg from './components/easter-egg';
import config from './config';
import './styles/index.css';

const { dataSource } = config();

ReactDOM.render(
  <>
    <App data={dataSource} />
    <EasterEgg />
  </>,
  document.getElementById('root')
);
