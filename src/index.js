import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';
import config from './config';
import './styles/index.css';

const { dataSource } = config();
const showHistory = dataSource === 'random' || dataSource === 'mock';

ReactDOM.render(
  <App
    allowHistoryDeletion={showHistory}
    data={dataSource}
    showHistory={showHistory}
  />,
  document.getElementById('root')
);
