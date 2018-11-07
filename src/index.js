import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './utils/registerServiceWorker';
import LoadData from './components/load-data';
import './styles/index.css';

ReactDOM.render(<LoadData />, document.getElementById('root'));
registerServiceWorker();
