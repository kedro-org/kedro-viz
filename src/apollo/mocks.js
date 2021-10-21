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

export const runMetaDataQueryMock = {
  request: {
    query: GET_RUN_METADATA,
  },
  result: {
    data: {
      metadata: RunMock.buildList(10),
    },
  },
};

export const runTrackingDataMock = {
  request: {
    query: GET_RUNS_TRACKING_DATA,
  },
  result: {
    data: {
      metadata: RunMock.buildList(10),
    },
  },
};
