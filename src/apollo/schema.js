import { SchemaLink } from '@apollo/client/link/schema';
import { makeExecutableSchema } from '@graphql-tools/schema';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';

import gql from 'graphql-tag';

const typeDefs = gql`
  scalar JSONObject

  type Query {
    runsList: [Run!]!
    runMetadata(runIds: [ID!]!): [Run!]!
    runTrackingData(
      runIds: [ID!]!
      showDiff: Boolean = false
    ): [TrackingDataset!]!
  }

  type Run {
    id: ID!
    title: String!
    timestamp: String!
    author: String
    gitBranch: String
    gitSha: String
    bookmark: Boolean
    notes: String
    runCommand: String
  }

  type Subscription {
    runAdded(runId: ID!): Run!
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
