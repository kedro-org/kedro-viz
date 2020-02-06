import React from 'react';
import NodeListGroups, { mapStateToProps } from './node-list-groups';
import { mockState, setup } from '../../utils/state.mock';
import { getNodeTypes } from '../../selectors/node-types';
import { getGroupedNodes } from '../../selectors/nodes';

describe('NodeListGroups', () => {
  it('handles collapse button click events', () => {
    const nodes = getGroupedNodes(mockState.lorem);
    const types = getNodeTypes(mockState.lorem);
    const wrapper = setup.mount(<NodeListGroups nodes={nodes} types={types} />);
    const nodeList = () => wrapper.find('.pipeline-node-list--nested').first();
    const toggle = () => wrapper.find('.pipeline-type-group-toggle').first();
    expect(nodeList().length).toBe(1);
    expect(toggle().hasClass('pipeline-type-group-toggle--alt')).toBe(false);
    toggle().simulate('click');
    expect(nodeList().length).toBe(1);
    expect(toggle().hasClass('pipeline-type-group-toggle--alt')).toBe(true);
  });

  it('maps state to props', () => {
    const expectedResult = {
      types: expect.arrayContaining([
        expect.objectContaining({
          disabled: expect.any(Boolean),
          id: expect.any(String),
          name: expect.any(String)
        })
      ])
    };
    expect(mapStateToProps(mockState.lorem)).toEqual(expectedResult);
  });
});
