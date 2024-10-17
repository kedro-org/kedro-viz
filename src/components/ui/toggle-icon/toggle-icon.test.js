import React from 'react';
import { shallow } from 'enzyme';
import { ToggleIcon } from './node-list-row-toggle';

describe('ToggleIcon', () => {
  const baseProps = {
    name: 'Test Node',
    onChange: jest.fn(),
    onToggleHoveredFocusMode: jest.fn(),
  };

  it('applies "all-unchecked" class when allUnchecked is true', () => {
    const props = { ...baseProps, allUnchecked: true };
    const wrapper = shallow(<ToggleIcon {...props} />);
    expect(wrapper.hasClass('node-list-row-toggle--icon--all-unchecked')).toBe(
      true
    );
  });

  it('applies "disabled" class when disabled is true', () => {
    const props = { ...baseProps, disabled: true };
    const wrapper = shallow(<ToggleIcon {...props} />);
    expect(wrapper.hasClass('node-list-row-toggle--disabled')).toBe(true);
  });

  it('applies "checked" class when isChecked is true', () => {
    const props = { ...baseProps, isChecked: true };
    const wrapper = shallow(<ToggleIcon {...props} />);
    expect(wrapper.hasClass('node-list-row-toggle--icon--checked')).toBe(true);
  });

  it('applies "parent" class when isParent is true', () => {
    const props = { ...baseProps, isParent: true };
    const wrapper = shallow(<ToggleIcon {...props} />);
    expect(wrapper.hasClass('node-list-row-toggle--icon--parent')).toBe(true);
  });

  it('applies correct class for kind prop', () => {
    const kinds = ['modularPipeline', 'data', 'task'];
    kinds.forEach((kind) => {
      const props = { ...baseProps, kind };
      const wrapper = shallow(<ToggleIcon {...props} />);
      expect(wrapper.hasClass(`node-list-row-toggle--kind-${kind}`)).toBe(true);
    });
  });

  it('does not apply "all-unchecked" class when allUnchecked is false', () => {
    const props = { ...baseProps, allUnchecked: false };
    const wrapper = shallow(<ToggleIcon {...props} />);
    expect(wrapper.hasClass('node-list-row-toggle--icon--all-unchecked')).toBe(
      false
    );
  });

  it('does not apply "disabled" class when disabled is false', () => {
    const props = { ...baseProps, disabled: false };
    const wrapper = shallow(<ToggleIcon {...props} />);
    expect(wrapper.hasClass('node-list-row-toggle--disabled')).toBe(false);
  });

  it('does not apply "checked" class when isChecked is false', () => {
    const props = { ...baseProps, isChecked: false };
    const wrapper = shallow(<ToggleIcon {...props} />);
    expect(wrapper.hasClass('node-list-row-toggle--icon--checked')).toBe(false);
  });

  it('does not apply "parent" class when isParent is false', () => {
    const props = { ...baseProps, isParent: false };
    const wrapper = shallow(<ToggleIcon {...props} />);
    expect(wrapper.hasClass('node-list-row-toggle--icon--parent')).toBe(false);
  });

  it('triggers onChange callback when clicked', () => {
    const props = { ...baseProps };
    const wrapper = shallow(<ToggleIcon {...props} />);
    wrapper.simulate('click');
    expect(props.onChange).toHaveBeenCalled();
  });

  it('does not trigger onToggleHoveredFocusMode when not provided', () => {
    const props = { ...baseProps, onToggleHoveredFocusMode: undefined };
    const wrapper = shallow(<ToggleIcon {...props} />);
    wrapper.simulate('click');
    // Since onToggleHoveredFocusMode is not provided, it should not throw an error
    expect(() => wrapper.simulate('click')).not.toThrow();
  });

  it('triggers onToggleHoveredFocusMode when provided and clicked', () => {
    const props = { ...baseProps };
    const wrapper = shallow(<ToggleIcon {...props} />);
    wrapper.simulate('click');
    expect(props.onToggleHoveredFocusMode).toHaveBeenCalled();
  });
});
