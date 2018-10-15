import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './utils/registerServiceWorker';
import App from './components/app';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
