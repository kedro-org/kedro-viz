import gql from 'graphql-tag';

/** query for runsList sidebar */
export const GET_RUNS = gql`
  query getRunsList {
    runsList {
      bookmark
      gitSha
      id
      timestamp
      title
    }
  }
`;

/** query for details metadata component */
export const GET_RUN_METADATA = gql`
  query getRunMetadata($runs: [ID]!) {
    runMetadata(runIDs: $runs) {
      author
      gitBranch
      gitSha
      notes
      runCommand
      timestamp
      title
    }
  }
`;

/** query for collapsable run details component */
export const GET_RUN_TRACKING_DATA = gql`
  query getRunTrackingData($runs: [ID]!) {
    runTrackingData(runIDs: $runs) {
      datasetName
      datasetType
      data
    }
  }
`;

/** query for collapsable run details component */
export const GET_RUN_TRACKING_DATA_WITH_DIFF = gql`
  query getRunTrackingData($runs: [ID]!, $showDiff: Boolean) {
    runTrackingData(runIDs: $runs, showDiff: $showDiff) {
      datasetName
      datasetType
      data
    }
  }
`;
