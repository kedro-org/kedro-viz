import formatSnapshots from './format-data';
import { getInitialState } from '../components/app/load-data';

// Example data for use in tests
export const mockData = [
  {
    created_ts: '1551452832000',
    kernel_ai_schema_id: '310750827599783',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    json_schema: [
      {
        inputs: ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
        name: 'consectetur',
        outputs: ['Aliquam', 'eu', 'accumsan', 'mauris'],
        tags: ['Nulla', 'pulvinar', 'enim', 'consectetur', 'volutpat']
      }
    ]
  }
];

// Example state object for use in tests of redux-enabled components
export const mockState = getInitialState(formatSnapshots(mockData), {
  allowHistoryDeletion: true,
  allowUploads: true,
  onDeleteSnapshot: true,
  showHistory: true
});
