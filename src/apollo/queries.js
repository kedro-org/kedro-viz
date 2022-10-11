import gql from 'graphql-tag';

/** query for runsList sidebar */
export const GET_RUNS = gql`
  query getRunsList {
    runsList {
      bookmark
      gitSha
      id
      title
      notes
    }
  }
`;

/** query for runMetadata and runDataset components */
export const GET_RUN_DATA = gql`
  query getRunData($runIds: [ID!]!) {
    runMetadata(runIds: $runIds) {
      id
      author
      bookmark
      gitBranch
      gitSha
      notes
      runCommand
      title
    }
    runTrackingData(runIds: $runIds) {
      runIds
      plots
      metrics
      json
    }
  }
`;

/** query for obtaining installed and latest Kedro-Viz versions */
export const GET_VERSIONS = gql`
  query getVersion {
    version {
      installed
      isOutdated
      latest
    }
  }
`;
