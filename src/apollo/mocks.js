import { Factory } from 'fishery';
import faker from '@faker-js/faker';
import { GET_RUNS, GET_RUN_METADATA, GET_RUN_TRACKING_DATA } from './queries';

export const RunMock = Factory.define(({ sequence }) => {
  return {
    author: faker.git.shortSha(),
    bookmark: faker.datatype.boolean(),
    gitBranch: faker.git.branch(),
    gitSha: faker.git.commitSha(),
    id: `abcd0m${sequence}`,
    notes: faker.random.words(10),
    runCommand: faker.random.words(5),
    title: faker.random.words(3),
  };
});

const TrackingDatasetMock = Factory.define(() => {
  return {
    runId: faker.random.words(3),
    value: faker.datatype.number(),
  };
});

export const TrackingDataMock = Factory.define(() => {
  return {
    datasetName: faker.random.words(2),
    datasetType: faker.random.words(2),
    data: {
      [faker.random.words(1)]: TrackingDatasetMock.buildList(1),
    },
  };
});

/** mock for runList data */
export const runsListQueryMock = {
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
/** This will be enabled with in a separate ticket*/
export const runMetadataQueryMock = {
  request: {
    query: GET_RUN_METADATA,
    variables: {
      runs: 'test',
    },
  },
  result: {
    data: {
      runMetadata: RunMock.buildList(1),
    },
  },
};

/** mock for tracking data */
/** WIP: the run variable will be replaced by an input to enable dynamic input of variables*/
/** This will be enabled with in a separate ticket*/
export const runTrackingDataMock = {
  request: {
    query: GET_RUN_TRACKING_DATA,
    variables: {
      runs: 'test',
    },
  },
  result: {
    data: {
      trackingData: TrackingDataMock.buildList(5),
    },
  },
};
