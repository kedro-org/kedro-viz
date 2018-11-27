import React from 'react';
import { json } from 'd3-fetch';
import config from '../../config';
import { generateRandomDataArray } from '../../utils/randomData';
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
      this.state.data = generateRandomDataArray();
    } else {
      json(dataPath).then(json_schema => {
        this.setState({
          data: [{ json_schema }]
        });
      });
    }

    this.onDeleteSnapshot = this.onDeleteSnapshot.bind(this);
  }

  onDeleteSnapshot(id) {
    this.setState({
      data: this.state.data.filter(d => d.kernel_ai_schema_id !== id)
    });
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
          showHistory={true}
          allowHistoryDeletion={true}
          onDeleteSnapshot={this.onDeleteSnapshot}
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
