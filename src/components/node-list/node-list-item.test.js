import React from 'react';
import {
  NodeListItem,
  mapStateToProps,
  mapDispatchToProps
} from './node-list-item';
import { mockState, setup } from '../../utils/state.mock';
import { getNodeData } from '../../selectors/nodes';
describe('NodeListGroup', () => {
  describe('node list item', () => {
    const node = getNodeData(mockState.lorem)[0];
    const dispatch = jest.fn();
    const wrapper = setup.mount(
      <NodeListItem
        node={node}
        disabled={node.disabled}
        onToggleNodeHovered={dispatch}
      />
    );
    const nodeRow = () => wrapper.find('.pipeline-node');

    it('handles mouseenter events', () => {
      nodeRow().simulate('mouseenter');
      expect(dispatch.mock.calls.length).toEqual(1);
    });

    it('handles mouseleave events', () => {
      nodeRow().simulate('mouseleave');
      expect(dispatch.mock.calls.length).toEqual(2);
    });

    it('uses active class if active', () => {
      const activeNode = Object.assign({}, node, { active: true });
      const activeNodeWrapper = setup.mount(<NodeListItem node={activeNode} />);
      expect(
        activeNodeWrapper
          .find('.pipeline-node')
          .hasClass('pipeline-node--active')
      ).toBe(true);
    });

    it('uses disabled class if disabled (via type/tag only)', () => {
      const disabledNode = Object.assign({}, node, { disabled_type: true });
      const disabledNodeWrapper = setup.mount(
        <NodeListItem node={disabledNode} />
      );
      expect(
        disabledNodeWrapper
          .find('.pipeline-node')
          .hasClass('pipeline-node--disabled')
      ).toBe(true);
    });
  });

  describe('node list item checkbox', () => {
    const node = getNodeData(mockState.lorem)[0];
    const dispatch = jest.fn();
    const wrapper = setup.mount(
      <NodeListItem
        node={node}
        disabled={node.disabled}
        onToggleNodesDisabled={dispatch}
      />
    );
    const checkbox = () => wrapper.find('.kui-switch__input');

    it('handles toggle event', () => {
      checkbox().simulate('change', { target: { checked: false } });
      expect(dispatch.mock.calls.length).toEqual(1);
    });
  });

  it('maps state to props', () => {
    const expectedResult = {
      theme: expect.stringMatching(/light|dark/)
    };
    expect(mapStateToProps(mockState.lorem)).toEqual(expectedResult);
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();
    const nodeHovered = '123';
    mapDispatchToProps(dispatch).onToggleNodeHovered(nodeHovered);
    expect(dispatch.mock.calls[0][0]).toEqual({
      nodeHovered,
      type: 'TOGGLE_NODE_HOVERED'
    });

    const node = getNodeData(mockState.lorem)[0];
    mapDispatchToProps(dispatch).onToggleNodesDisabled([node.id], true);
    expect(dispatch.mock.calls[1][0]).toEqual({
      nodeIDs: [node.id],
      isDisabled: true,
      type: 'TOGGLE_NODES_DISABLED'
    });
  });
});
