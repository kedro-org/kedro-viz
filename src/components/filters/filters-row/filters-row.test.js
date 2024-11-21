import React from 'react';
import { mount } from 'enzyme';
import FiltersRow from './filters-row';

describe('FiltersRow Component', () => {
  it('renders without crashing', () => {
    const wrapper = mount(<FiltersRow container={'div'} />);
    expect(wrapper.exists()).toBe(true);
  });

  it('renders correct visible classnames', () => {
    const wrapper = mount(<FiltersRow container={'div'} visible={true} />);
    expect(wrapper.find('.filter-row').hasClass('filter-row--visible')).toBe(
      true
    );
  });

  it('renders correct unchecked classnames', () => {
    const wrapper = mount(<FiltersRow container={'div'} checked={false} />);
    expect(wrapper.find('.filter-row').hasClass('filter-row--unchecked')).toBe(
      true
    );
  });
});
