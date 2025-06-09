import { statusMockData } from '../utils/status-mock-data';
import { datasetError } from '../utils/run-status-mock-data/dataset-error';
import { workingAllGreen } from '../utils/run-status-mock-data/working-all-green';
import { funNodeError } from '../utils/run-status-mock-data/fun-node-error';

export default function runStatus(state = funNodeError || {}, action) {
  return state;
}
