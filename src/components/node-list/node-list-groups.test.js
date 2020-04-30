import React from 'react';
import NodeListGroups, {
  mapStateToProps,
  mapDispatchToProps
} from './node-list-groups';
import { mockState, setup } from '../../utils/state.mock';
import { getNodeTypes } from '../../selectors/node-types';
import { getNodeData, getGroupedNodes } from '../../selectors/nodes';

describe('NodeListGroups', () => {
  it('handles collapse button click events', () => {
    const nodes = getGroupedNodes(mockState.lorem);
    const types = getNodeTypes(mockState.lorem);
    const wrapper = setup.mount(<NodeListGroups nodes={nodes} types={types} />);
    const nodeList = () => wrapper.find('.pipeline-nodelist--nested').first();
    const toggle = () => wrapper.find('.pipeline-type-group-toggle').first();
    expect(nodeList().length).toBe(1);
    expect(toggle().hasClass('pipeline-type-group-toggle--alt')).toBe(false);
    toggle().simulate('click');
    expect(nodeList().length).toBe(1);
    expect(toggle().hasClass('pipeline-type-group-toggle--alt')).toBe(true);
  });

  it('maps state to props', () => {
    const expectedResult = {
      nodeActive: expect.any(Object),
      nodeSelected: expect.any(Object),
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

  describe('map dispatch to props', () => {
    const node = getNodeData(mockState.lorem)[0];

    it('toggles clicked nodes', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleNodeClicked(node.id);
      expect(dispatch.mock.calls[0][0]).toEqual({
        nodeClicked: node.id,
        type: 'TOGGLE_NODE_CLICKED'
      });
    });

    it('toggles hovered nodes', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleNodeHovered(node.id);
      expect(dispatch.mock.calls[0][0]).toEqual({
        nodeHovered: node.id,
        type: 'TOGGLE_NODE_HOVERED'
      });
    });

    it('toggles nodes disabled', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleNodesDisabled([node.id], true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        nodeIDs: [node.id],
        isDisabled: true,
        type: 'TOGGLE_NODES_DISABLED'
      });
    });
  });
});
