import React from 'react';
import RunsListCard from '.';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount, shallow } from 'enzyme';

configure({ adapter: new Adapter() });

// Mocked methods

const mockUpdateRunDetails = jest.fn();

jest.mock('../../../apollo/mutations', () => {
  return {
    useUpdateRunDetails: () => {
      return {
        updateRunDetails: mockUpdateRunDetails,
      };
    },
  };
});

// Setup

const randomRun = {
  bookmark: false,
  id: 'ef32bfd',
  timestamp: new Date('October 15, 2021 03:24:00').toISOString(),
  title: 'Sprint 4 EOW',
};

const selectedRunIds = ['ef32bfd'];

const savedRun = {
  bookmark: true,
  id: 'ef32bfd',
  timestamp: new Date('October 15, 2021 03:24:00').toISOString(),
  title: 'Sprint 4 EOW',
  notes: 'star',
};

const nonActiveRun = {
  bookmark: true,
  id: 'af32bfd',
  timestamp: new Date('October 15, 2021 03:24:00').toISOString(),
  title: 'Sprint 4 EOW',
};

// Tests

describe('RunsListCard', () => {
  it('renders without crashing', () => {
    const wrapper = shallow(
      <RunsListCard data={randomRun} selectedRunIds={selectedRunIds} />
    );

    expect(wrapper.find('.runs-list-card').length).toBe(1);
    expect(wrapper.find('.runs-list-card__title').length).toBe(1);
  });

  it('renders with a bookmark icon', () => {
    const wrapper = shallow(
      <RunsListCard data={savedRun} selectedRunIds={selectedRunIds} />
    );

    expect(wrapper.find('.runs-list-card__bookmark').length).toBe(1);
  });

  it('does not render with check icon for single view', () => {
    const wrapper = shallow(
      <RunsListCard
        data={randomRun}
        enableComparisonView={false}
        selectedRunIds={selectedRunIds}
      />
    );

    expect(wrapper.find('.runs-list-card__checked').length).toBe(0);
  });

  it('renders with an unchecked check icon for comparison view', () => {
    const wrapper = shallow(
      <RunsListCard
        data={nonActiveRun}
        enableComparisonView={true}
        selectedRunIds={selectedRunIds}
      />
    );

    expect(wrapper.find('.runs-list-card__checked--comparing').length).toBe(1);
  });

  it('renders with an inactive bookmark icon', () => {
    const wrapper = shallow(
      <RunsListCard
        data={randomRun}
        enableComparisonView={false}
        selectedRunIds={selectedRunIds}
      />
    );

    expect(wrapper.find('.runs-list-card__bookmark--stroke').length).toBe(1);
  });

  it('renders with an active bookmark icon', () => {
    const wrapper = shallow(
      <RunsListCard
        data={savedRun}
        enableComparisonView={false}
        selectedRunIds={selectedRunIds}
      />
    );

    expect(wrapper.find('.runs-list-card__bookmark--solid').length).toBe(1);
  });

  it('calls a function on click and adds an active class', () => {
    const setActive = jest.fn();
    const wrapper = mount(
      <RunsListCard
        data={randomRun}
        onRunSelection={() => setActive('ef32bfd')}
        selectedRunIds={selectedRunIds}
      />
    );
    const onClick = jest.spyOn(React, 'useState');

    onClick.mockImplementation((active) => [active, setActive]);
    wrapper.simulate('click');
    expect(setActive).toBeTruthy();
    expect(wrapper.find('.runs-list-card--active').length).toBe(1);
  });

  it('calls the updateRunDetails function', () => {
    const wrapper = mount(
      <RunsListCard
        data={randomRun}
        enableComparisonView={true}
        selectedRunIds={selectedRunIds}
      />
    );

    wrapper.simulate('click', {
      target: {
        classList: {
          contains: () => true,
          tagName: 'path',
        },
      },
    });

    expect(mockUpdateRunDetails).toHaveBeenCalled();
  });

  it('displays the notes in the runs card when notes matches search value', () => {
    const wrapper = mount(
      <RunsListCard
        data={savedRun}
        selectedRunIds={selectedRunIds}
        searchValue={'star'}
      />
    );

    expect(wrapper.find('.runs-list-card__notes').length).toBe(1);
  });
});
