import React from 'react';
import { shallow } from 'enzyme';
import { NodeListRowToggle } from './node-list-row-toggle';

describe('NodeListRowToggle', () => {
  const baseProps = {
    name: 'Test Node',
    onChange: jest.fn(),
    onToggleHoveredFocusMode: jest.fn(),
  };

  it('applies "all-unchecked" class when allUnchecked is true', () => {
    const props = { ...baseProps, allUnchecked: true };
    const wrapper = shallow(<NodeListRowToggle {...props} />);
    expect(wrapper.hasClass('node-list-row-toggle--icon--all-unchecked')).toBe(true);
  });

  it('applies "disabled" class when disabled is true', () => {
    const props = { ...baseProps, disabled: true };
    const wrapper = shallow(<NodeListRowToggle {...props} />);
    expect(wrapper.hasClass('node-list-row-toggle--disabled')).toBe(true);
  });

  it('applies "checked" class when isChecked is true', () => {
    const props = { ...baseProps, isChecked: true };
    const wrapper = shallow(<NodeListRowToggle {...props} />);
    expect(wrapper.hasClass('node-list-row-toggle--icon--checked')).toBe(true);
  });

  it('applies "parent" class when isParent is true', () => {
    const props = { ...baseProps, isParent: true };
    const wrapper = shallow(<NodeListRowToggle {...props} />);
    expect(wrapper.hasClass('node-list-row-toggle--icon--parent')).toBe(true);
  });

  it('applies correct class for kind prop', () => {
    const kinds = ['modularPipeline', 'data', 'task'];
    kinds.forEach(kind => {
      const props = { ...baseProps, kind };
      const wrapper = shallow(<NodeListRowToggle {...props} />);
      expect(wrapper.hasClass(`node-list-row-toggle--kind-${kind}`)).toBe(true);
    });
  });
});