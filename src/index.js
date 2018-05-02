import React from 'react';
import ReactDOM from 'react-dom';
import '@quantumblack/carbon-ui-components/dist/carbon-ui.min.css';
import './styles/index.css';
import registerServiceWorker from './utils/registerServiceWorker';
import App from './components/app';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
