import React from 'react';
import ReactDOM from 'react-dom';
import App from './index';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <App
      allowHistoryDeletion={true}
      allowUploads={true}
      data="random"
      showHistory={true}
    />,
    div
  );
  ReactDOM.unmountComponentAtNode(div);
});
