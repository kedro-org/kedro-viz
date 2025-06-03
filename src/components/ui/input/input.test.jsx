import React from 'react';
import Input from '.';
import { shallow, mount } from 'enzyme';

describe('Input', () => {
  it('renders without crashing', () => {
    const wrapper = shallow(<Input />);

    expect(wrapper.find('.input').length).toBe(1);
    expect(wrapper.find('.input--large').length).toBe(1);
  });

  it('renders with a smaller font size and a character counter', () => {
    const wrapper = shallow(<Input characterLimit={50} size="small" />);

    expect(wrapper.find('.input').length).toBe(1);
    expect(wrapper.find('.input--small').length).toBe(1);
    expect(wrapper.find('.input-character-count').length).toBe(1);
  });

  it('renders with a default text value with type textarea', () => {
    const wrapper = mount(<Input type="textarea" defaultValue="Default!" />);
    const defaultInputValue = wrapper.find('textarea').prop('value');

    expect(wrapper.props().defaultValue).toEqual(defaultInputValue);
  });

  it('renders with a default text value with type input', () => {
    const wrapper = mount(<Input type="input" defaultValue="Default!" />);
    const defaultInputValue = wrapper.find('input').prop('value');

    expect(wrapper.props().defaultValue).toEqual(defaultInputValue);
  });
});
