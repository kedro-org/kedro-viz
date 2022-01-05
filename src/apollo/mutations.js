import gql from 'graphql-tag';

export const UPDATE_RUN_DETAILS = gql`
  mutation updateRunDetails($runId: ID!, $runInput: RunInput!) {
    updateRunDetails(runId: $runId, runInput: $runInput) {
      ... on UpdateRunDetailsFailure {
        errorMessage
        id
      }
      ... on UpdateRunDetailsSuccess {
        run {
          bookmark
          id
          notes
          title
        }
      }
    }
  }
`;
