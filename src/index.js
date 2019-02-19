import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './utils/registerServiceWorker';
import App from './components/app';
import config from './config';
import './styles/index.css';

const { dataSource } = config;
const useRandomData = dataSource === 'random';

ReactDOM.render(
  <App
    allowHistoryDeletion={useRandomData}
    allowUploads={true}
    data={dataSource}
    showHistory={useRandomData} />,
  document.getElementById('root')
);
registerServiceWorker();
