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
  },
  {
    created_ts: '1551452123456',
    kernel_ai_schema_id: '123456789012345',
    message: 'List of animal names',
    json_schema: [
      {
        inputs: ['cat', 'dog'],
        name: 'salmon',
        outputs: ['pig', 'horse', 'sheep'],
        tags: ['huge', 'small']
      },
      {
        inputs: ['cat', 'weasel', 'elephant', 'bear'],
        name: 'shark',
        outputs: ['sheep', 'pig', 'giraffe']
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
