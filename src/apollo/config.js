import fetch from 'cross-fetch';
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';
import { replaceMatches } from '../utils';

const sanitizedPathname = (pathname) =>
  replaceMatches(pathname, {
    'experiment-tracking': '',
  });

let link;

if (typeof window !== 'undefined') {
  const { host, pathname, protocol } = window.location;

  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

  const wsHost =
    process.env.NODE_ENV === 'development' ? 'localhost:4142' : host;

  // Browser environment, include WebSocket link
  const wsLink = new WebSocketLink({
    uri: `${wsProtocol}//${wsHost}${sanitizedPathname(pathname)}graphql`,
    options: {
      reconnect: true,
    },
  });

  const httpLink = createHttpLink({
    // our graphql endpoint, normally here: http://localhost:4141/graphql
    uri: `${sanitizedPathname(pathname)}graphql`,
    fetch,
  });

  // Conditionally split between HTTP and WebSocket links
  split(
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
} else {
  // Server environment, only use HTTP link
  link = createHttpLink({
    // our graphql endpoint, normally here: http://localhost:4141/graphql
    // Use '/' as default pathname
    uri: `${sanitizedPathname('/')}graphql`,
    fetch,
  });
}

export const client = new ApolloClient({
  connectToDevTools: true,
  link,
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
