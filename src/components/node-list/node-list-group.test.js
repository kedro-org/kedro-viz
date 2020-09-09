import React from 'react';
import { NodeListGroup } from './node-list-group';
import { getNodeTypes } from '../../selectors/node-types';
import { setup, mockState } from '../../utils/state.mock';

describe('NodeListGroup', () => {
  it('renders without throwing', () => {
    const type = getNodeTypes(mockState.animals)[0];
    expect(() => setup.mount(<NodeListGroup type={type} />)).not.toThrow();
  });

  it('renders children', () => {
    const type = getNodeTypes(mockState.animals)[0];
    const wrapper = setup.mount(
      <NodeListGroup type={type}>
        <div className="test-child" />
      </NodeListGroup>
    );
    expect(wrapper.find('.test-child').length).toBe(1);
  });

  it('handles checkbox change events', () => {
    const type = getNodeTypes(mockState.animals)[0];
    const onToggleChecked = jest.fn();
    const wrapper = setup.mount(
      <NodeListGroup type={type} onToggleChecked={onToggleChecked} />
    );
    const checkbox = () => wrapper.find('input');
    checkbox().simulate('change', { target: { checked: false } });
    expect(onToggleChecked.mock.calls.length).toEqual(1);
  });

  it('handles collapse button click events', () => {
    const type = getNodeTypes(mockState.animals)[0];
    const onToggleCollapsed = jest.fn();
    const wrapper = setup.mount(
      <NodeListGroup type={type} onToggleCollapsed={onToggleCollapsed} />
    );
    wrapper.find('.pipeline-type-group-toggle').simulate('click');
    expect(onToggleCollapsed.mock.calls.length).toEqual(1);
  });

  it('hides children when collapsed class is used', () => {
    const type = getNodeTypes(mockState.animals)[0];
    const wrapper = setup.mount(<NodeListGroup type={type} collapsed={true} />);
    expect(wrapper.find('.pipeline-nodelist--nested').length).toEqual(0);
  });
});
