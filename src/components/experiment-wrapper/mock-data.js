export const runs = [
  {
    id: 'd36fce9',
    author: 'Luke Skywalker',
    bookmark: true,
    timestamp: '2021-09-08T10:55:36.810Z',
    gitSha: 'ad60192',
    gitBranch: 'feature/new-feature',
    runCommand: 'kedro run --pipeline my_pipeline',
    notes:
      'But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful.',
    title: 'My Favorite Sprint',
    details: {
      'Digital Analysis Metrics': [
        {
          bootstrap: 'true',
        },
        {
          classWeight: '-',
        },
      ],
      'Shopper Spend Raw Metrics': [
        {
          maxFeatures: 'auto',
        },
        {
          minSamplesLeaf: 12564,
        },
      ],
      'Digital Analysis Features': [
        {
          AU_SSID_NULLS: 234,
        },
        {
          AR_ARM_NULLS: 34,
        },
      ],
    },
  },
  {
    id: '05542fb',
    author: 'Leia Organa',
    bookmark: false,
    timestamp: '2021-09-07T11:36:24.560Z',
    gitSha: 'bt60142',
    gitBranch: 'feature/new-feature',
    runCommand: 'kedro run --pipeline my_pipeline',
    notes:
      'On the other hand, we denounce with righteous indignation and dislike men who are so beguiled.',
    title: 'Another favorite sprint',
    details: {
      'Digital Analysis Metrics': [
        {
          bootstrap: 'false',
        },
        {
          classWeight: 'low',
        },
      ],
      'Shopper Spend Raw Metrics': [
        {
          maxFeatures: 'min',
        },
        {
          minSamplesLeaf: 1,
        },
      ],
      'Digital Analysis Features': [
        {
          AU_SSID_NULLS: 99,
        },
        {
          AR_ARM_NULLS: 40,
        },
      ],
    },
  },
  {
    id: '80c0d3a',
    author: 'Obi-wan Kenobi',
    bookmark: false,
    timestamp: '2021-09-04T04:36:24.560Z',
    gitSha: 'tz24689',
    gitBranch: 'feature/new-feature',
    runCommand: 'kedro run --pipeline my_pipeline',
    notes:
      'On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment',
    title: 'Slick test this one',
    details: {
      'Digital Analysis Metrics': [
        {
          bootstrap: 'false',
        },
        {
          classWeight: 'high',
        },
      ],
      'Shopper Spend Raw Metrics': [
        {
          maxFeatures: 'max',
        },
        {
          minSamplesLeaf: 12564,
        },
      ],
      'Digital Analysis Features': [
        {
          AU_SSID_NULLS: 234,
        },
        {
          AR_ARM_NULLS: 34,
        },
      ],
    },
  },
];

// {
//   "metadata": {
//     "author": "Luke Skywalker",
//     "gitBranch": "feature/new-feature",
//     "gitSha": "ad60192",
//     "notes": "Something descriptive about something here.",
//     "runCommand": "kedro run --pipeline my_pipeline",
//     "timestamp": "2021-09-08T10:55:36.810Z",
//   },
//   "details": {
//     "metrics": {
//       ...
//     },
//     "somethingElse": {
//       ...
//     }
//   }
// }
