import React from 'react';
import RunsListCard from '.';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount, shallow } from 'enzyme';

configure({ adapter: new Adapter() });

const randomRun = {
  bookmark: false,
  id: 'ef32bfd',
  timestamp: new Date('October 15, 2021 03:24:00').toISOString(),
  title: 'Sprint 4 EOW',
};

const selectedRuns = ['ef32bfd'];

const savedRun = {
  bookmark: true,
  id: 'ef32bfd',
  timestamp: new Date('October 15, 2021 03:24:00').toISOString(),
  title: 'Sprint 4 EOW',
};

describe('RunsListCard', () => {
  it('renders without crashing', () => {
    const wrapper = shallow(
      <RunsListCard data={randomRun} selectedRuns={selectedRuns} />
    );

    expect(wrapper.find('.runs-list-card').length).toBe(1);
    expect(wrapper.find('.runs-list-card__title').length).toBe(1);
  });

  it('renders with a bookmark icon', () => {
    const wrapper = shallow(
      <RunsListCard data={savedRun} selectedRuns={selectedRuns} />
    );

    expect(wrapper.find('.runs-list-card__bookmark').length).toBe(1);
  });

  it('renders with an unchecked check icon', () => {
    const wrapper = shallow(
      <RunsListCard
        data={randomRun}
        enableComparisonView
        selectedRuns={selectedRuns}
      />
    );

    expect(wrapper.find('.runs-list-card__checked--comparing').length).toBe(1);
  });

  it('calls a function on click and adds an active class', () => {
    const setActive = jest.fn();
    const wrapper = mount(
      <RunsListCard
        data={randomRun}
        onRunSelection={() => setActive('ef32bfd')}
        selectedRuns={selectedRuns}
      />
    );
    const onClick = jest.spyOn(React, 'useState');

    onClick.mockImplementation((active) => [active, setActive]);
    wrapper.simulate('click');
    expect(setActive).toBeTruthy();
    expect(wrapper.find('.runs-list-card--active').length).toBe(1);
    expect(wrapper.find('svg.runs-list-card__checked--active').length).toBe(1);
  });
});
