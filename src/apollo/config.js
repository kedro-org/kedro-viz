import { ApolloClient, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
  connectToDevTools: true,
  uri: 'http://localhost:4142/graphql',
  cache: new InMemoryCache(),
  resolvers: {},
  defaultOptions: {
    query: {
      errorPolicy: 'all',
    },
  },
});
