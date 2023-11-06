import fetch from 'cross-fetch';
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { sanitizedPathname } from '../utils';

const httpLink = createHttpLink({
  // our graphql endpoint, normally here: http://localhost:4141/graphql
  uri: `${sanitizedPathname()}graphql`,
  fetch,
});

const splitLink = split(({ query }) => {
  const definition = getMainDefinition(query);

  return definition.kind === 'OperationDefinition';
}, httpLink);

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
