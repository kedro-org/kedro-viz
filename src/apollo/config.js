import { schemaLink } from './schema';
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const link = createHttpLink({
  /** Your graphql endpoint */
  uri: 'http://localhost:4000/',
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
