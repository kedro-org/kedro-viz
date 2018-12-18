import React from 'react';
import { json } from 'd3-fetch';
import config from '../../config';
import getRandomHistory from '../../utils/randomData';
import App from '../app';

const { dataPath, dataSource } = config;

const useRandomData = dataSource === 'random';

class LoadData extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: null
    };

    if (useRandomData) {
      this.state.data = getRandomHistory();
    } else {
      json(dataPath)
        .then(json_schema => {
          this.setState({
            data: [{ json_schema }]
          });
        })
        .catch(() => {
          console.error(`Unable to load pipeline data. Please check that you have placed a file at ${dataPath}`)
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

    return data ? (
      <App
        allowUploads={true}
        showHistory={useRandomData}
        allowHistoryDeletion={useRandomData}
        onDeleteSnapshot={this.onDeleteSnapshot}
        data={data} />
    ) : null;
  }
}

export default LoadData;
