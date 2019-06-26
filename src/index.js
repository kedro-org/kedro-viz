import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';
import config from './config';
import './styles/index.css';

const { dataSource } = config();
const useRandomData = dataSource === 'random';

ReactDOM.render(
  <App
    allowHistoryDeletion={useRandomData}
    data={dataSource}
    showHistory={useRandomData}
  />,
  document.getElementById('root')
);
