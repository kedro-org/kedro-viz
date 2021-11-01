import gql from 'graphql-tag';

/** query for runsList sidebar */
export const GET_RUNS = gql`
  query getRunsList {
    runsList {
      id
      metadata {
        id
        title
        bookmark
        gitSha
        timestamp
      }
    }
  }
`;
/** query for details metadata component */
export const GET_RUN_METADATA = gql`
  query getRunMetadata($run: [ID]!) {
    runsWithData(run: $run) {
      id
      metadata {
        author
        gitBranch
        gitSha
        bookmark
        title
        notes
        timestamp
        runCommand
      }
    }
  }
`;

/** query for collapsable run details component */
export const GET_RUNS_TRACKING_DATA = gql`
  query getRunMetadata($run: [ID]!) {
    runsWithData(run: $run) {
      id
      runTrackingData {
        details
      }
    }
  }
`;
