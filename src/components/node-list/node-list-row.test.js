import React from 'react';
import NodeListRow, { mapStateToProps } from './node-list-row';
import { getNodeData } from '../../selectors/nodes';
import { setup, mockState } from '../../utils/state.mock';

describe('NodeListRow', () => {
  const node = getNodeData(mockState.animals)[0];
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
      const nodeRow = () => wrapper.find('.pipeline-nodelist__row');
      nodeRow().simulate('mouseenter');
      expect(props.onMouseEnter.mock.calls.length).toEqual(1);
    });

    it('handles mouseleave events', () => {
      const { props } = setupProps();
      const wrapper = setup.mount(<NodeListRow {...props} />);
      const nodeRow = () => wrapper.find('.pipeline-nodelist__row');
      nodeRow().simulate('mouseleave');
      expect(props.onMouseLeave.mock.calls.length).toEqual(1);
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

    it('shows count if count prop set', () => {
      const { props } = setupProps();
      const mockCount = 123;
      const wrapper = setup.mount(<NodeListRow {...props} count={mockCount} />);
      expect(wrapper.find('.pipeline-nodelist__row__count').text()).toBe(
        mockCount.toString()
      );
    });

    it('does not show count if count prop not set', () => {
      const { props } = setupProps();
      const wrapper = setup.mount(<NodeListRow {...props} count={null} />);
      expect(wrapper.find('.pipeline-nodelist__row__count').exists()).toBe(
        false
      );
    });

    describe('focus mode', () => {
      it('sets the visibility toggle to the checked mode when the row is selected for focus mode', () => {
        const { props } = setupProps();
        const wrapper = setup.mount(
          <NodeListRow {...props} focusMode={node} type="modularPipeline" />
        );

        expect(
          wrapper.find('.pipeline-row__toggle-icon--focus-checked').exists()
        ).toBe(true);
      });

      it('sets a disabled label to appear activated when the row belongs to a modular pipeline selected by focus mode', () => {
        const selectedItem = { id: 'abc' };
        const { props } = setupProps();
        const wrapper = setup.mount(
          <NodeListRow
            {...props}
            focusMode={selectedItem}
            parentDisabled={false}
            parentPipeline={'abc'}
            disabled={true}
          />
        );

        expect(
          wrapper.find('.pipeline-nodelist__row__label--disabled').exists()
        ).toBe(false);
      });

      it('sets a disabled label to follow its own disabled status when it belongs to the main pipeline', () => {
        const selectedItem = { id: 'abc' };
        const { props } = setupProps();
        const wrapper = setup.mount(
          <NodeListRow
            {...props}
            focusMode={selectedItem}
            parentDisabled={false}
            parentPipeline={'main'}
            disabled={true}
          />
        );

        expect(
          wrapper.find('.pipeline-nodelist__row__label--disabled').exists()
        ).toBe(true);
      });

      it('sets the row label to remain as deactived if parent is not part of selected focus mode', () => {
        const selectedItem = { id: '123' };
        const { props } = setupProps();
        const wrapper = setup.mount(
          <NodeListRow
            {...props}
            focusMode={selectedItem}
            parentDisabled={true}
            parentPipeline={'abc'}
            disabled={true}
          />
        );

        expect(
          wrapper.find('.pipeline-nodelist__row__label--disabled').exists()
        ).toBe(true);
      });

      it('sets the row label to remain as deactived if it is a node that does not belong to a selected modular pipeline', () => {
        const selectedItem = { id: '123' };
        const { props } = setupProps();
        const wrapper = setup.mount(
          <NodeListRow
            {...props}
            type={'node'}
            focusMode={selectedItem}
            parentDisabled={undefined}
            disabled={true}
          />
        );

        expect(
          wrapper.find('.pipeline-nodelist__row__label--disabled').exists()
        ).toBe(true);
      });

      it('sets the row label to be activated if it is a node that belongs to a selected modular pipeline', () => {
        const selectedItem = { id: '123' };
        const { props } = setupProps();
        const wrapper = setup.mount(
          <NodeListRow
            {...props}
            type={'node'}
            focusMode={selectedItem}
            parentDisabled={undefined}
            disabled={false}
          />
        );

        expect(
          wrapper.find('.pipeline-nodelist__row__label--disabled').exists()
        ).toBe(false);
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
    expect(mapStateToProps(mockState.animals, {})).toEqual(expectedResult);
  });
});
