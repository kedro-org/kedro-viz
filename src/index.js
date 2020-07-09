import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import 'what-input';
import App from './components/app';
import EasterEgg from './components/easter-egg';
import getPipelineData from './utils/data-source';
import loadData from './store/load-data';
import './styles/index.css';

const KedroViz = () => {
  const [data, updateData] = useState(getPipelineData());
  useEffect(() => {
    if (data === 'json') {
      loadData().then(updateData);
    }
  }, [data]);

  return (
    <>
      <App data={data} />
      <EasterEgg />
    </>
  );
};

ReactDOM.render(<KedroViz />, document.getElementById('root'));
