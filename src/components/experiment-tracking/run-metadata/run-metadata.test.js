import React from 'react';
import configureMockStore from 'redux-mock-store';
import RunMetadata from '.';
import { runs } from '../../experiment-wrapper/mock-data';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import { configure, mount } from 'enzyme';
import { setup } from '../../../utils/state.mock';

configure({ adapter: new Adapter() });
const mockStore = configureMockStore();

describe('RunMetadata', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(
      <RunMetadata isSingleRun={runs.length === 1 ? true : false} runs={runs} />
    );

    expect(wrapper.find('.details-metadata').length).toBe(1);
    expect(wrapper.find('.details-metadata__run').length).toBe(4);
  });

  it('renders a first run for when theres a single run', () => {
    const wrapper = setup.mount(
      <RunMetadata
        enableComparisonView={true}
        isSingleRun={runs.slice(0, 1).length === 1 ? true : false}
        runs={runs.slice(0, 1)}
      />
    );

    expect(wrapper.find('.details-metadata').length).toBe(1);
    expect(wrapper.find('.details-metadata__run--first-run').length).toBe(1);
  });

  it('contains "-comparison-view" classname for when the comparison mode is enabled', () => {
    const wrapper = setup.mount(
      <RunMetadata enableComparisonView={true} runs={runs.slice(0, 1)} />
    );

    expect(
      wrapper.find('.details-metadata__table-comparison-view').length
    ).toBe(1);
  });

  it('shows a "--first-run" for the first run when comparison mode is on', () => {
    const wrapper = setup.mount(
      <RunMetadata
        enableComparisonView={true}
        isSingleRun={runs.slice(0, 1).length === 1 ? true : false}
        runs={runs.slice(0, 1)}
      />
    );
    expect(wrapper.find('.details-metadata__run--first-run').length).toBe(1);
    expect(
      wrapper.find('.details-metadata__run--first-run-comparison-view').length
    ).toBe(1);
  });

  let wrapper, store;

  beforeEach(() => {
    const initialState = {
      runsMetadata: { [runs[0].id]: runs[0], [runs[1].id]: runs[1] },
    };

    store = mockStore(initialState);

    wrapper = mount(
      <RunMetadata runs={runs.slice(0, 2)} isSingleRun={false} store={store} />
    );
  });

  it('handles show more/less button click event', () => {
    const setToggleNotes = jest.fn();
    const onClick = jest.spyOn(React, 'useState');
    onClick.mockImplementation((toggleNotes) => [toggleNotes, setToggleNotes]);

    expect(wrapper.find('.details-metadata__show-more').text()).toMatch(
      'Show more'
    );

    wrapper.find('.details-metadata__show-more').simulate('click');
    expect(setToggleNotes).toBeTruthy();
    expect(wrapper.find('.details-metadata__show-more').text()).toMatch(
      'Show less'
    );

    wrapper.find('.details-metadata__show-more').simulate('click');
    expect(setToggleNotes).toBeTruthy();
    expect(wrapper.find('.details-metadata__show-more').text()).toMatch(
      'Show more'
    );
  });

  it('enables the pin button when show changes is enabled ', () => {
    expect(wrapper.find('.pipeline-menu-button__pin').length).toEqual(2);
  });
});
