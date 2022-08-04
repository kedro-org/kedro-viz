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

/** query for details metadata component */
export const GET_RUN_METADATA = gql`
  query getRunMetadata($runIds: [ID!]!) {
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
  }
`;

/** query for collapsable run details component */
export const GET_RUN_TRACKING_DATA = gql`
  query getRunTrackingData($runIds: [ID!]!, $showDiff: Boolean) {
    plots: runTrackingData(runIds: $runIds, showDiff: $showDiff, group: PLOT) {
      ...trackingDatasetFields
    }
    metrics: runTrackingData(
      runIds: $runIds
      showDiff: $showDiff
      group: METRIC
    ) {
      ...trackingDatasetFields
    }
    JSONData: runTrackingData(
      runIds: $runIds
      showDiff: $showDiff
      group: JSON
    ) {
      ...trackingDatasetFields
    }
  }

  fragment trackingDatasetFields on TrackingDataset {
    data
    datasetName
    datasetType
    runIds
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
