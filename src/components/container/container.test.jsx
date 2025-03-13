import React from 'react';
import { shallow } from 'enzyme';
import Container from './index';

describe('Container', () => {
  it('renders without crashing', () => {
    const wrapper = shallow(<Container />);
    expect(wrapper.find('App')).toHaveLength(1);
  });
});
