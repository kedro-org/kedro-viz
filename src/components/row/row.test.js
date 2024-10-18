import React from 'react';
import { mount } from 'enzyme';
import { Row } from './row';

// Mock props
const mockProps = {
  name: 'Test Row',
  kind: 'modular-pipeline',
  active: false,
  disabled: false,
  selected: false,
  visible: true,
  onMouseEnter: jest.fn(),
  onMouseLeave: jest.fn(),
  onClick: jest.fn(),
  icon: null,
  type: 'modularPipeline',
  checked: true,
  focused: false,
};

describe('Row Component', () => {
  it('renders without crashing', () => {
    const wrapper = mount(<Row {...mockProps} />);
    expect(wrapper.find({ title: mockProps.name }).exists()).toBe(true);
  });

  it('handles mouse enter and leave events', () => {
    const wrapper = mount(<Row {...mockProps} />);
    const nodeRow = () => wrapper.find('.row');

    nodeRow().simulate('mouseenter');
    expect(mockProps.onMouseEnter).toHaveBeenCalled();
    nodeRow().simulate('mouseleave');
    expect(mockProps.onMouseLeave).toHaveBeenCalled();
  });

  it('toggles visibility correctly', () => {
    let wrapper = mount(<Row {...mockProps} />);
    const nodeRow = () => wrapper.find('.row');

    expect(nodeRow().hasClass('row--visible')).toBe(true);
    wrapper = mount(<Row {...mockProps} visible={false} />);
    expect(nodeRow().hasClass('row--visible')).toBe(false);
  });

  it('updates class when the "selected" prop changes', () => {
    let wrapper = mount(<Row {...mockProps} />);
    expect(wrapper.find('.row').hasClass('row--selected')).toBe(false);
    wrapper.setProps({ selected: true });
    wrapper = wrapper.update();
    expect(wrapper.find('.row').hasClass('row--selected')).toBe(true);
  });
});
