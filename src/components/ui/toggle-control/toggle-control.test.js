import React from 'react';
import { shallow } from 'enzyme';
import { ToggleControl } from './toggle-control';

describe('ToggleControl', () => {
  const baseProps = {
    name: 'Test Node',
    onChange: jest.fn(),
    onToggleHoveredFocusMode: jest.fn(),
  };

  it('applies correct class for kind prop', () => {
    const kinds = ['modularPipeline', 'data', 'task'];
    kinds.forEach((kind) => {
      const props = { ...baseProps, kind };
      const wrapper = shallow(<ToggleControl {...props} />);
      expect(wrapper.hasClass(`toggle-control--kind-${kind}`)).toBe(true);
    });
  });

  it('does not apply "all-unchecked" class when allUnchecked is false', () => {
    const props = { ...baseProps, allUnchecked: false };
    const wrapper = shallow(<ToggleControl {...props} />);
    expect(wrapper.hasClass('toggle-control--icon--all-unchecked')).toBe(false);
  });

  it('does not apply "disabled" class when disabled is false', () => {
    const props = { ...baseProps, disabled: false };
    const wrapper = shallow(<ToggleControl {...props} />);
    expect(wrapper.hasClass('toggle-control--disabled')).toBe(false);
  });

  it('does not apply "checked" class when isChecked is false', () => {
    const props = { ...baseProps, isChecked: false };
    const wrapper = shallow(<ToggleControl {...props} />);
    expect(wrapper.hasClass('toggle-control--icon--checked')).toBe(false);
  });

  it('does not apply "parent" class when isParent is false', () => {
    const props = { ...baseProps, isParent: false };
    const wrapper = shallow(<ToggleControl {...props} />);
    expect(wrapper.hasClass('toggle-control--icon--parent')).toBe(false);
  });

  it('does not trigger onToggleHoveredFocusMode when not provided', () => {
    const props = { ...baseProps, onToggleHoveredFocusMode: undefined };
    const wrapper = shallow(<ToggleControl {...props} />);
    wrapper.simulate('mouseenter');
    expect(() => wrapper.simulate('mouseenter')).not.toThrow();
  });

  it('triggers onToggleHoveredFocusMode when provided', () => {
    const props = { ...baseProps };
    const wrapper = shallow(<ToggleControl {...props} />);
    wrapper.simulate('mouseenter');
    expect(props.onToggleHoveredFocusMode).toHaveBeenCalled();
  });
});
