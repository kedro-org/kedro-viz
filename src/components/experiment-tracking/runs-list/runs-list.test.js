import React from 'react';
import configureMockStore from 'redux-mock-store';
import RunsList from '.';
import { ApolloProvider } from '@apollo/client';
import { client } from '../../../apollo/config';
import { setup } from '../../../utils/state.mock';
import { HoverStateContext } from '../utils/hover-state-context';
import { runs } from '../../experiment-wrapper/mock-data';

const runDataList = [
  {
    id: new Date('October 15, 2021 03:24:00').toISOString(),
  },
  {
    id: new Date('October 15, 2021 03:26:00').toISOString(),
  },
  {
    id: new Date('October 15, 2021 03:29:00').toISOString(),
  },
  {
    id: new Date('October 15, 2021 03:32:00').toISOString(),
  },
];

const mockStore = configureMockStore();
const setHoveredElementId = jest.fn();
const mockContextValue = {
  setHoveredElementId,
  hoveredElementId: [new Date('October 15, 2021 03:35:00').toISOString()],
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: 'localhost:3000/',
  }),
}));

describe('RunsListCard', () => {
  let store;
  beforeEach(() => {
    const initialState = {
      runsMetadata: { [runs[0].id]: runs[0], [runs[1].id]: runs[1] },
    };

    store = mockStore(initialState);
  });

  it('renders without crashing', () => {
    const wrapper = setup.mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <RunsList
          runData={runDataList}
          selectedRunIds={['run3']}
          store={store}
        />
      </HoverStateContext.Provider>
    );

    expect(wrapper.find('.runs-list__wrapper').length).toBe(1);
  });

  it('renders the search bar', () => {
    const wrapper = setup.mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <RunsList
          runData={runDataList}
          selectedRunIds={['run3']}
          store={store}
        />
      </HoverStateContext.Provider>
    );

    expect(wrapper.find('.search-bar-wrapper').length).toBe(1);
  });

  it('displays the right search amount of cards for the search', () => {
    const stateSetter = jest.fn();
    jest
      .spyOn(React, 'useState')
      //Simulate that searchValue state value
      .mockImplementation((stateValue) => [(stateValue = 'run'), stateSetter]);

    const wrapper = setup.mount(
      <ApolloProvider client={client}>
        <HoverStateContext.Provider value={mockContextValue}>
          <RunsList runData={runDataList} selectedRunIds={['run3']} />
        </HoverStateContext.Provider>
      </ApolloProvider>
    );

    expect(wrapper.find('.runs-list-card').length).toBe(4);
  });
});
