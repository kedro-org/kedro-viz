import { Factory } from 'fishery';
import faker from 'faker';
import { GET_RUNS, GET_RUN_METADATA, GET_RUNS_TRACKING_DATA } from './queries';

export const MetadataMock = Factory.define(({ sequence }) => ({
  author: faker.git.shortSha(),
  bookmark: faker.datatype.boolean(),
  gitBranch: faker.git.branch(),
  gitSha: faker.git.commitSha(),
  notes: faker.random.words(10),
  runCommand: faker.random.words(5),
  id: `abcd0m${sequence}`,
  timestamp: faker.date.past(),
  title: faker.random.words(3),
}));

export const TrackingDataMock = Factory.define(({ sequence }) => ({
  id: `abcd0m${sequence}`,
  trackingData: faker.random.words(10),
}));

export const TrackingDatasetMock = Factory.define(({ sequence }) => ({
  id: `abcd0m${sequence}`,
  trackingDataName: faker.random.words(),
}));

export const RunMock = Factory.define(({ sequence }) => {
  return {
    id: `abcd0m${sequence}`,
    metadata: MetadataMock.build(),
    trackingData: TrackingDataMock.build(),
  };
});

/** mock for runList data */
export const runsQueryMock = {
  request: {
    query: GET_RUNS,
  },
  result: {
    data: {
      runsList: RunMock.buildList(10),
    },
  },
};

/** mock for metadata data*/
/** WIP: the run variable will be replaced by an input to enable dynamic input of variables*/
/** This will be enabled with in a seperate ticket*/
export const runMetadataQueryMock = {
  request: {
    query: GET_RUN_METADATA,
    variables: {
      run: 'test',
    },
  },
  result: {
    data: {
      metadata: RunMock.build(),
    },
  },
};

/** mock for tracking data */
/** WIP: the run variable will be replaced by an input to enable dynamic input of variables*/
/** This will be enabled with in a seperate ticket*/
export const runTrackingDataMock = {
  request: {
    query: GET_RUNS_TRACKING_DATA,
    variables: {
      run: 'test',
    },
  },
  result: {
    data: {
      trackingData: TrackingDataMock.build(),
    },
  },
};
