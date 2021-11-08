import fetch from 'cross-fetch';
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const link = createHttpLink({
  /** our graphql endpoint */
  uri: 'https://apollo-server-simple-demo.herokuapp.com/graphql',
  fetch,
});

export const client = new ApolloClient({
  connectToDevTools: true,
  link,
  cache: new InMemoryCache(),
  resolvers: {},
  defaultOptions: {
    query: {
      errorPolicy: 'all',
    },
  },
});
