import React from 'react';
import RunsListCard from '.';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount, shallow } from 'enzyme';

configure({ adapter: new Adapter() });

const randomRun = {
  metaData: {
    bookmark: false,
    runId: 'ef32bfd',
    timestamp: new Date('October 15, 2021 03:24:00'),
    title: 'Sprint 4 EOW',
  },
};

// const savedRun = {
//   bookmark: true,
//   id: 'ef32bfd',
//   timestamp: '2021-08-31T01:36:24.560Z',
//   title: 'Sprint 4 EOW',
// };

describe('RunsListCard', () => {
  it('renders without crashing', () => {
    const wrapper = shallow(<RunsListCard data={randomRun} />);

    expect(wrapper.find('.runs-list-card').length).toBe(1);
    expect(wrapper.find('.runs-list-card__title').length).toBe(1);
  });

  // it('renders with a bookmark icon', () => {
  //   const wrapper = shallow(<RunsListCard data={savedRun} />);

  //   expect(wrapper.find('.runs-list-card__bookmark').length).toBe(1);
  // });

  it('calls a function on click and adds an active class', () => {
    const setActive = jest.fn();
    const wrapper = mount(
      <RunsListCard data={randomRun} onClick={setActive} />
    );
    const onClick = jest.spyOn(React, 'useState');

    onClick.mockImplementation((active) => [active, setActive]);
    wrapper.simulate('click');
    expect(setActive).toBeTruthy();
    expect(wrapper.find('.runs-list-card--active').length).toBe(1);
  });
});
