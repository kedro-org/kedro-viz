import { Factory } from 'fishery';
import faker from 'faker';
import { GET_RUNS, GET_RUN_METADATA, GET_RUNS_TRACKING_DATA } from './queries';

export const MetaDataMock = Factory.define(({ sequence }) => ({
  runId: `abcd0m${sequence}`,
  author: faker.git.shortSha(),
  gitBranch: faker.git.branch(),
  gitSha: faker.git.commitSha(),
  bookmark: faker.datatype.boolean(),
  title: faker.random.words(3),
  notes: faker.random.words(10),
  timestamp: faker.date.past(),
  runCommand: faker.random.words(5),
}));

export const TrackingDataMock = Factory.define(({ sequence }) => ({
  runId: `abcd0m${sequence}`,
  trackingData: faker.random.words(10),
}));

export const TrackingDatasetMock = Factory.define(({ sequence }) => ({
  runId: `abcd0m${sequence}`,
  trackingDataName: faker.random.words(),
}));

export const RunMock = Factory.define(({ sequence }) => {
  return {
    runId: `abcd0m${sequence}`,
    metaData: MetaDataMock.build(),
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
export const runMetaDataQueryMock = {
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
