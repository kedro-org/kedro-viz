import formatSnapshots from './format-data';

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
        outputs: ['Aliquam', 'eu', 'accumsan', 'mauris']
      }
    ]
  }
];

// Example state object for use in tests of redux-enabled components
export const mockState = formatSnapshots(mockData);
