import fetch from 'cross-fetch';
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';

const wsHost =
  process.env.NODE_ENV === 'development'
    ? 'localhost:4142'
    : window.location.host;

const wsLink = new WebSocketLink({
  uri: `ws://${wsHost}/graphql`,
  options: {
    reconnect: true,
  },
});

const httpLink = createHttpLink({
  // our graphql endpoint, normally here: http://localhost:4141/graphql
  uri: '/graphql',
  fetch,
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);

    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  connectToDevTools: true,
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
