import React from 'react';
import { mount } from 'enzyme';
import { FilterRow } from './filter-row';

describe('FilterRow Component', () => {
  it('renders without crashing', () => {
    const wrapper = mount(<FilterRow />);
    expect(wrapper.exists()).toBe(true);
  });

  it('renders correct visible classnames', () => {
    const wrapper = mount(<FilterRow visible={true} />);
    expect(wrapper.find('.filter-row').hasClass('filter-row--visible')).toBe(
      true
    );
  });

  it('renders correct unchecked classnames', () => {
    const wrapper = mount(<FilterRow checked={false} />);
    expect(wrapper.find('.filter-row').hasClass('filter-row--unchecked')).toBe(
      true
    );
  });
});
