import fetch from 'cross-fetch';
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  Observable,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { sanitizedPathname } from '../utils';
import loadJsonData from '../store/load-data';

const apiBaseUrl = `${sanitizedPathname()}graphql`;

// HTTP link for GraphQL API calls
const httpLink = new HttpLink({
  uri: apiBaseUrl,
  fetch,
});

// Error handling link
const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward, response }) => {
    if (networkError) {
      console.error(`[Network error]: ${networkError}`);

      // Try reading from static file if network error occurs
      return new Observable((observer) => {
        (async () => {
          const { operationName, variables } = operation;
          let staticFilePath = `${apiBaseUrl}/${operationName}.json`;

          if (variables?.runIds) {
            staticFilePath = `${apiBaseUrl}/${operationName}/${variables.runIds}.json`;
          }

          try {
            const staticData = await loadJsonData(staticFilePath, null);
            if (staticData) {
              observer.next({ data: staticData });
              observer.complete();
            } else {
              observer.error(networkError);
            }
          } catch (error) {
            observer.error(networkError);
          }
        })();
      });
    }

    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        )
      );
    }
  }
);

// Combine the links
const link = ApolloLink.from([errorLink, httpLink]);

// Create the Apollo Client
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
