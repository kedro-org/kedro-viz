import { SchemaLink } from '@apollo/client/link/schema';
import { makeExecutableSchema } from '@graphql-tools/schema';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';

import gql from 'graphql-tag';

const typeDefs = gql`
  scalar JSON
  scalar JSONObject

  schema {
    query: Query
    subscription: Subscription
  }

  type Query {
    runsList: [Run]!
    runMetadata(runIDs: [ID]!): [Run!]!
    runTrackingData(
      runIDs: [ID]!
      showDiff: Boolean = false
    ): [TrackingDataset]!
  }

  type Subscription {
    runAdded(runID: ID!): Run!
  }

  type Run {
    author: String
    bookmark: Boolean
    gitBranch: String
    gitSha: String
    id: ID!
    notes: String
    runCommand: String
    timestamp: String!
    title: String!
  }

  type TrackingDataset {
    datasetName: String
    datasetType: String
    data: JSONObject
  }
`;

const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
};

export const schemaLink = new SchemaLink({
  schema: makeExecutableSchema({ typeDefs, resolvers }),
});
