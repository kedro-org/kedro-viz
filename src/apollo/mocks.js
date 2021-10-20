import { Factory } from 'fishery';
import faker from 'faker';
import { MockedResponse } from '@apollo/client/testing';
import { GET_RUNS, GET_RUN_METADATA, GET_RUNS_TRACKING_DATA } from './queries';

export const MetaDataMock = Factory.define(({ runID }) => ({
  runID,
  author: faker.git.shortSha(),
  gitBranch: faker.git.branch(),
  gitSha: faker.git.commitSha(),
  bookmark: faker.random.words(),
  title: faker.random.words(3),
  notes: faker.random.words(10),
  timestamp: faker.date.past(2),
  runCommand: faker.random.words(5),
}));

export const TrackingDataMock = Factory.define(({ runID }) => ({
  runID,
  trackingData: faker.random.words(10),
}));

export const RunMock = Factory.define(() => {
  const runID = faker.datatype.uuid();
  return {
    runID,
    metadata: MetaDataMock.build(runID),
    trackingData: MetaDataMock.build(runID),
  };
});

export const runsQueryMock = {
  request: {
    query: GET_RUNS,
  },
  result: {
    data: {
      runs: RunMock.buildList(10),
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
