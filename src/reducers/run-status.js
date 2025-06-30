import { funNodeError } from '../utils/run-status-mock-data/fun-node-error';

export default function runStatus(state = funNodeError || {}, action) {
  return state;
}
