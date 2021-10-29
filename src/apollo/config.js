import fetch from 'cross-fetch'; // this fetch import is needed to pass the 'testJSImport' test on the CI given that there is no default installed fetch on the CI enviroment.
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
