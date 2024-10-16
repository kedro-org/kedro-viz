import React from 'react';
import { NodeListRow, mapStateToProps } from './node-list-row';
import { getNodeData } from '../../selectors/nodes';
import { setup, mockState } from '../../utils/state.mock';

describe('NodeListRow', () => {
  const node = getNodeData(mockState.spaceflights)[0];
  const setupProps = () => {
    const props = {
      active: true,
      checked: true,
      disabled: false,
      faded: false,
      visible: true,
      id: node.id,
      label: node.highlightedLabel,
      name: node.name,
      onClick: jest.fn(),
      onMouseEnter: jest.fn(),
      onMouseLeave: jest.fn(),
      onChange: jest.fn(),
    };
    return { props };
  };

  it('renders without throwing', () => {
    expect(() => setup.mount(<NodeListRow {...setupProps()} />)).not.toThrow();
  });

  describe('node list item', () => {
    it('handles mouseenter events', () => {
      const { props } = setupProps();
      const wrapper = setup.mount(<NodeListRow {...props} />);
      const nodeRow = () => wrapper.find('.node-list-row');
      nodeRow().simulate('mouseenter');
      expect(props.onMouseEnter.mock.calls.length).toEqual(1);
    });

    it('handles mouseleave events', () => {
      const { props } = setupProps();
      const wrapper = setup.mount(<NodeListRow {...props} />);
      const nodeRow = () => wrapper.find('.node-list-row');
      nodeRow().simulate('mouseleave');
      expect(props.onMouseLeave.mock.calls.length).toEqual(1);
    });

    it('applies the overwrite class if not active', () => {
      const { props } = setupProps();
      const activeNodeWrapper = setup.mount(
        <NodeListRow {...props} active={false} />
      );
      expect(
        activeNodeWrapper
          .find('.node-list-row')
          .hasClass('node-list-row--overwrite')
      ).toBe(true);
    });

    it('applies the overwrite class if not selected or active', () => {
      const { props } = setupProps();
      const activeNodeWrapper = setup.mount(
        <NodeListRow {...props} selected={false} active={false} />
      );
      expect(
        activeNodeWrapper
          .find('.node-list-row')
          .hasClass('node-list-row--overwrite')
      ).toBe(true);
    });

    it('does not applies the overwrite class if not selected', () => {
      const { props } = setupProps();
      const activeNodeWrapper = setup.mount(
        <NodeListRow {...props} selected={true} />
      );
      expect(
        activeNodeWrapper
          .find('.node-list-row')
          .hasClass('node-list-row--overwrite')
      ).toBe(false);
    });

    it('does not applies the overwrite class if active', () => {
      const { props } = setupProps();
      const activeNodeWrapper = setup.mount(
        <NodeListRow {...props} active={true} />
      );
      expect(
        activeNodeWrapper
          .find('.node-list-row')
          .hasClass('node-list-row--overwrite')
      ).toBe(false);
    });

    it('uses active class if active', () => {
      const { props } = setupProps();
      const activeNodeWrapper = setup.mount(
        <NodeListRow {...props} active={true} />
      );
      expect(
        activeNodeWrapper
          .find('.node-list-row')
          .hasClass('node-list-row--active')
      ).toBe(true);
    });

    it('uses disabled class if disabled (via type/tag only)', () => {
      const { props } = setupProps();
      const disabledNodeWrapper = setup.mount(
        <NodeListRow {...props} disabled={true} />
      );
      expect(
        disabledNodeWrapper
          .find('.node-list-row')
          .hasClass('node-list-row--disabled')
      ).toBe(true);
    });

    it('shows count if count prop set', () => {
      const { props } = setupProps();
      const mockCount = 123;
      const wrapper = setup.mount(<NodeListRow {...props} count={mockCount} />);
      expect(wrapper.find('.node-list-row__count').text()).toBe(
        mockCount.toString()
      );
    });

    it('does not show count if count prop not set', () => {
      const { props } = setupProps();
      const wrapper = setup.mount(<NodeListRow {...props} count={null} />);
      expect(wrapper.find('.node-list-row__count').exists()).toBe(false);
    });

    describe('focus mode', () => {
      it('switches the visibility toggle from hide to show when the row is selected for focus mode', () => {
        const { props } = setupProps();
        const wrapper = setup.mount(
          <NodeListRow
            {...props}
            focused={true}
            checked={false}
            type="modularPipeline"
          />
        );
        expect(wrapper.find('VisibleIcon')).toHaveLength(1);
      });
    });
  });

  describe('node list item checkbox', () => {
    const { props } = setupProps();
    const wrapper = setup.mount(<NodeListRow {...props} />);
    const checkbox = () => wrapper.find('input');

    it('handles toggle event', () => {
      checkbox().simulate('change', { target: { checked: false } });
      expect(props.onChange.mock.calls.length).toEqual(1);
    });
  });

  it('maps state to props', () => {
    const expectedResult = expect.objectContaining({
      active: expect.any(Boolean),
    });
    expect(mapStateToProps(mockState.spaceflights, {})).toEqual(expectedResult);
  });
});
