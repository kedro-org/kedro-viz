import gql from 'graphql-tag';

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
