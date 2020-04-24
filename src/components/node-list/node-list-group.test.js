import React from 'react';
import { NodeListGroup, mapDispatchToProps } from './node-list-group';
import { mockState, setup } from '../../utils/state.mock';
import { getNodeTypes } from '../../selectors/node-types';

describe('NodeListGroup', () => {
  it('renders children', () => {
    const type = getNodeTypes(mockState.lorem)[0];
    const wrapper = setup.mount(
      <NodeListGroup type={type}>
        <div className="test-child" />
      </NodeListGroup>
    );
    expect(wrapper.find('.test-child').length).toBe(1);
  });

  it('handles checkbox change events', () => {
    const type = getNodeTypes(mockState.lorem)[0];
    const dispatch = jest.fn();
    const wrapper = setup.mount(
      <NodeListGroup type={type} onToggleTypeDisabled={dispatch} />
    );
    const checkbox = () => wrapper.find('input');
    checkbox().simulate('change', { target: { checked: false } });
    expect(dispatch.mock.calls.length).toEqual(1);
  });

  it('handles collapse button click events', () => {
    const type = getNodeTypes(mockState.lorem)[0];
    const dispatch = jest.fn();
    const wrapper = setup.mount(
      <NodeListGroup type={type} onToggleCollapsed={dispatch} />
    );
    wrapper.find('.pipeline-type-group-toggle').simulate('click');
    expect(dispatch.mock.calls.length).toEqual(1);
  });

  it('hides children when collapsed class is used', () => {
    const type = getNodeTypes(mockState.lorem)[0];
    const wrapper = setup.mount(<NodeListGroup type={type} collapsed={true} />);
    expect(wrapper.find('.pipeline-nodelist--nested').length).toEqual(0);
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();
    mapDispatchToProps(dispatch).onToggleTypeDisabled('456', false);
    expect(dispatch.mock.calls[0][0]).toEqual({
      typeID: '456',
      disabled: false,
      type: 'TOGGLE_TYPE_DISABLED'
    });
  });
});
