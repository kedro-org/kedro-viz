import React from 'react';
import NodeListRow from './node-list-row';
import { setup } from '../../../utils/state.mock';

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

describe('NodeListRow Component', () => {
  it('renders without crashing', () => {
    expect(() => setup.mount(<NodeListRow {...mockProps} />)).not.toThrow();
  });

  it('handles mouseenter events', () => {
    const wrapper = setup.mount(<NodeListRow {...mockProps} />);
    const nodeRow = () => wrapper.find('.node-list-row');
    nodeRow().simulate('mouseenter');
    expect(mockProps.onMouseEnter.mock.calls.length).toEqual(1);
  });

  it('handles mouseleave events', () => {
    const wrapper = setup.mount(<NodeListRow {...mockProps} />);
    const nodeRow = () => wrapper.find('.node-list-row');
    nodeRow().simulate('mouseleave');
    expect(mockProps.onMouseLeave.mock.calls.length).toEqual(1);
  });

  it('applies the node-list-row--active class when active is true', () => {
    const wrapper = setup.mount(<NodeListRow {...mockProps} active={true} />);
    expect(
      wrapper.find('.node-list-row').hasClass('node-list-row--active')
    ).toBe(true);
  });

  it('applies the node-list-row--selected class when selected is true', () => {
    const wrapper = setup.mount(<NodeListRow {...mockProps} selected={true} />);
    expect(
      wrapper.find('.node-list-row').hasClass('node-list-row--selected')
    ).toBe(true);
  });

  it('applies the node-list-row--selected class when highlight is true and isSlicingPipelineApplied is false', () => {
    const wrapper = setup.mount(
      <NodeListRow
        {...mockProps}
        highlight={true}
        isSlicingPipelineApplied={false}
      />
    );
    expect(
      wrapper.find('.node-list-row').hasClass('node-list-row--selected')
    ).toBe(true);
  });

  it('applies the overwrite class if not selected or active', () => {
    const activeNodeWrapper = setup.mount(
      <NodeListRow {...mockProps} selected={false} active={false} />
    );
    expect(
      activeNodeWrapper
        .find('.node-list-row')
        .hasClass('node-list-row--overwrite')
    ).toBe(true);
  });
});
