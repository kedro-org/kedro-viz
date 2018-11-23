import React from 'react';
import { json } from 'd3-fetch';
import config from '../../config';
import App from '../app';

const { dataPath, dataSource } = config;

class LoadData extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: null
    };

    if (dataSource !== 'random') {
      json(dataPath).then(json_schema => {
        this.setState({
          data: [{ json_schema }]
        });
      });
    }
  }

  render() {
    return this.state.data && (
      <App data={this.state.data} />
    )
  }
}

export default LoadData;
