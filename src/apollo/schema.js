import { SchemaLink } from '@apollo/client/link/schema';
import { makeExecutableSchema } from '@graphql-tools/schema';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';

import gql from 'graphql-tag';

const typeDefs = gql`
  type Runs {
    runs: [Run!]!
  }
  type Run {
    id: ID!
    bookmark: Boolean!
    timestamp: String!
    title: String!
    metadata: [RunMetadata!]!
    details: [RunDetails!]!
  }
  type RunMetadata {
    id: ID!
    author: String!
    gitBranch: String!
    gitSha: String!
    notes: String!
    runCommand: String!
  }
  type RunDetails {
    id: ID!
    name: String!
    details: JSONObject
  }
`;

const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
};

export const schemaLink = new SchemaLink({
  schema: makeExecutableSchema({ typeDefs, resolvers }),
});
