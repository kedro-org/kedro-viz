import React from 'react';
import { json } from 'd3-fetch';
import config from '../../config';
import generateRandomData from '../../utils/randomData';
import App from '../app';

const { dataPath, dataSource } = config;

class LoadData extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: dataSource === 'random' ? generateRandomData() : null
    };

    if (dataSource !== 'random') {
      json(dataPath).then(data => {
        this.setState({ data });
      });
    }
  }

  render() {
    return <App data={this.state.data} />
  }
}

export default LoadData;
