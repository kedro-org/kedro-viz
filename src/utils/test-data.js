import formatSnapshots from './format-data';

export const fakeData = [
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

export const fakeState = formatSnapshots(fakeData);
