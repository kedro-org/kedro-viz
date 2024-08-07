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

// Static file fetching link
const staticFileLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    (async () => {
      const { operationName, variables } = operation;
      let staticFilePath = `/data/${operationName}.json`;

      if (variables?.runIds) {
        staticFilePath = `/data/${operationName}/${variables.runIds}.json`;
      }

      try {
        const staticData = await loadJsonData(staticFilePath, null);
        if (staticData) {
          observer.next({ data: staticData });
          observer.complete();
        } else {
          forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer),
          });
        }
      } catch (error) {
        forward(operation).subscribe({
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        });
      }
    })();
  });
});

// HTTP link for GraphQL API calls
const httpLink = new HttpLink({
  uri: apiBaseUrl,
  fetch,
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Combine the links
const link = ApolloLink.from([staticFileLink, errorLink, httpLink]);

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
