import React from 'react';
import configureMockStore from 'redux-mock-store';
import RunsListCard from '.';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount } from 'enzyme';
import { HoverStateContext } from '../utils/hover-state-context';
import { setup } from '../../../utils/state.mock';
import { runs } from '../../experiment-wrapper/mock-data';

configure({ adapter: new Adapter() });
const mockStore = configureMockStore();

const setHoveredElementId = jest.fn();

// Setup

const randomRunId = new Date('October 15, 2021 03:24:00').toISOString();
const randomRun = {
  id: randomRunId,
};

const selectedRunIds = [randomRunId];

const savedRun = {
  id: new Date('September 08 2021 11:55:36:810').toISOString(),
};

const nonActiveRun = {
  id: new Date('October 15, 2021 03:28:00').toISOString(),
};

const mockContextValue = {
  setHoveredElementId,
  hoveredElementId: [new Date('October 25, 2021 03:30:00').toISOString()],
};

// Tests

describe('RunsListCard', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <RunsListCard data={randomRun} selectedRunIds={selectedRunIds} />
      </HoverStateContext.Provider>
    );

    expect(wrapper.find('.runs-list-card').length).toBe(1);
    expect(wrapper.find('.runs-list-card__title').length).toBe(1);
  });

  it('renders with a bookmark icon', () => {
    const wrapper = setup.mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <RunsListCard data={savedRun} selectedRunIds={selectedRunIds} />
      </HoverStateContext.Provider>
    );

    expect(wrapper.find('.runs-list-card__bookmark').length).toBe(2);
  });

  it('does not render with check icon for single view', () => {
    const wrapper = setup.mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <RunsListCard
          data={randomRun}
          enableComparisonView={false}
          selectedRunIds={selectedRunIds}
        />
      </HoverStateContext.Provider>
    );

    expect(wrapper.find('.runs-list-card__checked').length).toBe(0);
  });

  it('renders with an unchecked check icon for comparison view', () => {
    const wrapper = setup.mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <RunsListCard
          data={nonActiveRun}
          enableComparisonView={true}
          selectedRunIds={selectedRunIds}
        />
      </HoverStateContext.Provider>
    );

    expect(wrapper.find('.runs-list-card__checked--comparing').length).toBe(1);
  });

  it('renders with an inactive bookmark icon', () => {
    const wrapper = setup.mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <RunsListCard
          data={randomRun}
          enableComparisonView={false}
          selectedRunIds={selectedRunIds}
        />
      </HoverStateContext.Provider>
    );

    expect(wrapper.find('.runs-list-card__bookmark--stroke').length).toBe(2);
  });

  let store;
  beforeEach(() => {
    const initialState = {
      runsMetaData: { [runs[0].id]: runs[0], [runs[1].id]: runs[1] },
    };

    store = mockStore(initialState);
  });

  it('renders with an active bookmark icon', () => {
    const wrapper = mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <RunsListCard
          data={savedRun}
          enableComparisonView={false}
          selectedRunIds={selectedRunIds}
          store={store}
        />
      </HoverStateContext.Provider>
    );

    expect(wrapper.find('.runs-list-card__bookmark--solid').length).toBe(2);
  });

  it('calls a function on click and adds an active class', () => {
    const setActive = jest.fn();

    const wrapper = setup.mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <RunsListCard
          data={randomRun}
          onRunSelection={() => setActive(randomRunId)}
          selectedRunIds={selectedRunIds}
          store={store}
        />
      </HoverStateContext.Provider>
    );
    const onClick = jest.spyOn(React, 'useState');

    onClick.mockImplementation((active) => [active, setActive]);
    const div = wrapper.find('div').first();
    div.simulate('click');

    expect(setActive).toBeTruthy();
    expect(wrapper.find('.runs-list-card--active').length).toBe(1);
  });

  it('displays the notes in the runs card when notes matches search value', () => {
    const wrapper = setup.mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <RunsListCard
          data={savedRun}
          selectedRunIds={selectedRunIds}
          searchValue={'explain'}
          store={store}
        />
      </HoverStateContext.Provider>
    );

    expect(wrapper.find('.runs-list-card__notes').length).toBe(1);
  });
});
