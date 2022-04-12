import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ApolloProvider } from '@apollo/client';
import { client } from '../../apollo/config';
import {
  runsListQueryMock,
  runMetadataQueryMock,
  runTrackingDataMock,
} from '../../apollo/mocks';

export const GraphQLProvider = ({ useMocks = false, children }) => {
  if (useMocks) {
    return (
      <MockedProvider
        mocks={[runsListQueryMock, runMetadataQueryMock, runTrackingDataMock]}
      >
        <>{children}</>
      </MockedProvider>
    );
  }

  return (
    <ApolloProvider client={client}>
      <>{children}</>
    </ApolloProvider>
  );
};
