import React from 'react';
import { shallow } from 'enzyme';
import { VisibilityControl } from './visibility-control';

describe('VisibilityControl', () => {
  const baseProps = {
    name: 'Test Node',
    onChange: jest.fn(),
    onToggleHoveredFocusMode: jest.fn(),
  };

  it('applies "disabled" class when disabled is true', () => {
    const props = { ...baseProps, disabled: true };
    const wrapper = shallow(<VisibilityControl {...props} />);
    expect(wrapper.hasClass('visibility-control--disabled')).toBe(true);
  });

  it('applies correct class for kind prop', () => {
    const kinds = ['modularPipeline', 'data', 'task'];
    kinds.forEach((kind) => {
      const props = { ...baseProps, kind };
      const wrapper = shallow(<VisibilityControl {...props} />);
      expect(wrapper.hasClass(`visibility-control--kind-${kind}`)).toBe(true);
    });
  });

  it('does not apply "all-unchecked" class when allUnchecked is false', () => {
    const props = { ...baseProps, allUnchecked: false };
    const wrapper = shallow(<VisibilityControl {...props} />);
    expect(wrapper.hasClass('visibility-control--icon--all-unchecked')).toBe(
      false
    );
  });

  it('does not apply "disabled" class when disabled is false', () => {
    const props = { ...baseProps, disabled: false };
    const wrapper = shallow(<VisibilityControl {...props} />);
    expect(wrapper.hasClass('visibility-control--disabled')).toBe(false);
  });

  it('does not apply "checked" class when isChecked is false', () => {
    const props = { ...baseProps, isChecked: false };
    const wrapper = shallow(<VisibilityControl {...props} />);
    expect(wrapper.hasClass('visibility-control--icon--checked')).toBe(false);
  });

  it('does not apply "parent" class when isParent is false', () => {
    const props = { ...baseProps, isParent: false };
    const wrapper = shallow(<VisibilityControl {...props} />);
    expect(wrapper.hasClass('visibility-control--icon--parent')).toBe(false);
  });

  it('does not trigger onToggleHoveredFocusMode when not provided', () => {
    const props = { ...baseProps, onToggleHoveredFocusMode: undefined };
    const wrapper = shallow(<VisibilityControl {...props} />);
    wrapper.simulate('mouseenter');
    expect(() => wrapper.simulate('mouseenter')).not.toThrow();
  });

  it('triggers onToggleHoveredFocusMode when provided', () => {
    const props = { ...baseProps };
    const wrapper = shallow(<VisibilityControl {...props} />);
    wrapper.simulate('mouseenter');
    expect(props.onToggleHoveredFocusMode).toHaveBeenCalled();
  });
});
