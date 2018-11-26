import React from 'react';
import { json } from 'd3-fetch';
import config from '../../config';
import getRandomData from '../../utils/randomData';
import App from '../app';
import Store from '../store';

const { dataPath, dataSource } = config;

const useRandomData = dataSource === 'random';

class LoadData extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: null
    };

    if (useRandomData) {
      this.state.data = [
        getRandomData()
      ];
    } else {
      json(dataPath).then(json_schema => {
        this.setState({
          data: [{ json_schema }]
        });
      });
    }
  }

  render() {
    const { data } = this.state;

    if (!data) {
      return null;
    }

    if (useRandomData) {
      return (
        <Store
          allowUploads={true}
          showHistory={false}
          data={data} />
      );
    }

    return (
      <App
        allowUploads={true}
        showHistory={false}
        data={data} />
    );
  }
}

export default LoadData;
