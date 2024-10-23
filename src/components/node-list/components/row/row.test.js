import React from 'react';
import Row from './row';
import { setup } from '../../../../utils/state.mock';

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
    expect(() => setup.mount(<Row {...mockProps} />)).not.toThrow();
  });

  it('handles mouseenter events', () => {
    const wrapper = setup.mount(<Row {...mockProps} />);
    const nodeRow = () => wrapper.find('.row');
    nodeRow().simulate('mouseenter');
    expect(mockProps.onMouseEnter.mock.calls.length).toEqual(1);
  });

  it('handles mouseleave events', () => {
    const wrapper = setup.mount(<Row {...mockProps} />);
    const nodeRow = () => wrapper.find('.row');
    nodeRow().simulate('mouseleave');
    expect(mockProps.onMouseLeave.mock.calls.length).toEqual(1);
  });

  it('applies the row--active class when active is true', () => {
    const wrapper = setup.mount(<Row {...mockProps} active={true} />);
    expect(wrapper.find('.row').hasClass('row--active')).toBe(true);
  });

  it('applies the row--selected class when selected is true', () => {
    const wrapper = setup.mount(<Row {...mockProps} selected={true} />);
    expect(wrapper.find('.row').hasClass('row--selected')).toBe(true);
  });

  it('applies the row--selected class when highlight is true and isSlicingPipelineApplied is false', () => {
    const wrapper = setup.mount(
      <Row {...mockProps} highlight={true} isSlicingPipelineApplied={false} />
    );
    expect(wrapper.find('.row').hasClass('row--selected')).toBe(true);
  });

  it('applies the row--disabled class when disabled is true', () => {
    const wrapper = setup.mount(<Row {...mockProps} disabled={true} />);
    expect(wrapper.find('.row').hasClass('row--disabled')).toBe(true);
  });

  it('applies the overwrite class if not selected or active', () => {
    const activeNodeWrapper = setup.mount(
      <Row {...mockProps} selected={false} active={false} />
    );
    expect(activeNodeWrapper.find('.row').hasClass('row--overwrite')).toBe(
      true
    );
  });
});
