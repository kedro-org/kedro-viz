import { statusMockData } from '../utils/status-mock-data';

export default function status(state = statusMockData || {}, action) {
  return state;
}