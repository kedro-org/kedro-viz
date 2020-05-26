import React from 'react';
import NodeListRow from './node-list-row';
import { mockState, setup } from '../../utils/state.mock';
import { getNodeData } from '../../selectors/nodes';

describe('NodeListRow', () => {
  const node = getNodeData(mockState.lorem)[0];
  const setupProps = () => {
    const dispatch = jest.fn();
    const props = {
      active: node.active,
      checked: !node.disabled_node,
      disabled: node.disabled_tag || node.disabled_type,
      id: node.id,
      label: node.highlightedLabel,
      name: node.name,
      onClick: dispatch,
      onMouseEnter: dispatch,
      onMouseLeave: dispatch,
      onChange: dispatch,
      type: node.type
    };
    return { dispatch, props };
  };

  describe('node list item', () => {
    it('handles mouseenter events', () => {
      const { dispatch, props } = setupProps();
      const wrapper = setup.mount(<NodeListRow {...props} />);
      const nodeRow = () => wrapper.find('.pipeline-nodelist__row');
      nodeRow().simulate('mouseenter');
      expect(dispatch.mock.calls.length).toEqual(1);
    });

    it('handles mouseleave events', () => {
      const { dispatch, props } = setupProps();
      const wrapper = setup.mount(<NodeListRow {...props} />);
      const nodeRow = () => wrapper.find('.pipeline-nodelist__row');
      nodeRow().simulate('mouseleave');
      expect(dispatch.mock.calls.length).toEqual(1);
    });

    it('uses active class if active', () => {
      const { props } = setupProps();
      const activeNodeWrapper = setup.mount(
        <NodeListRow {...props} active={true} />
      );
      expect(
        activeNodeWrapper
          .find('.pipeline-nodelist__row')
          .hasClass('pipeline-nodelist__row--active')
      ).toBe(true);
    });

    it('uses disabled class if disabled (via type/tag only)', () => {
      const { props } = setupProps();
      const disabledNodeWrapper = setup.mount(
        <NodeListRow {...props} disabled={true} />
      );
      expect(
        disabledNodeWrapper
          .find('.pipeline-nodelist__row')
          .hasClass('pipeline-nodelist__row--disabled')
      ).toBe(true);
    });
  });

  describe('node list item checkbox', () => {
    const { dispatch, props } = setupProps();
    const wrapper = setup.mount(
      <NodeListRow {...props} onToggleNodesDisabled={dispatch} />
    );
    const checkbox = () => wrapper.find('input');

    it('handles toggle event', () => {
      checkbox().simulate('change', { target: { checked: false } });
      expect(dispatch.mock.calls.length).toEqual(1);
    });
  });
});
