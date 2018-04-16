import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import registerServiceWorker from './utils/registerServiceWorker';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
