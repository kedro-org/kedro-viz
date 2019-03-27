import { json } from 'd3-fetch';
import config from '../../config';
import getRandomHistory from '../../utils/random-data';
import formatSnapshots from '../../utils/format-data';

const loadData = (data, onResetStoreData) => {
  switch (data) {
    case 'random':
      return formatSnapshots(getRandomHistory());
    case 'json':
      loadJsonData(data).then(onResetStoreData);
      return formatSnapshots([]);
    case null:
      throw new Error('No data was provided to App component via props');
    default:
      return formatSnapshots(data);
  }
};

export const loadJsonData = kernel_ai_schema_id => {
  const { dataPath } = config;
  return json(dataPath)
    .then(json_schema =>
      formatSnapshots([
        {
          json_schema,
          kernel_ai_schema_id
        }
      ])
    )
    .catch(() => {
      throw new Error(
        `Unable to load pipeline data. Please check that you have placed a file at ${dataPath}`
      );
    });
};

export default loadData;
