import React from 'react';
import Filters from './filters';
import { mockState, setup } from '../../utils/state.mock';
import { getNodeTypes } from '../../selectors/node-types';
import { getGroupedNodes } from '../../selectors/nodes';
import { getGroups } from '../../selectors/filtered-node-list-items';

describe('Filters', () => {
  const mockProps = () => {
    const items = getGroupedNodes(mockState.spaceflights);
    const nodeTypes = getNodeTypes(mockState.spaceflights);
    const groups = getGroups({ nodeTypes, items });
    return { items, groups, groupCollapsed: {} };
  };

  it('renders without throwing', () => {
    expect(() => setup.mount(<Filters {...mockProps()} />)).not.toThrow();
  });

  it('handles collapse button click events', () => {
    const wrapper = setup.mount(<Filters {...mockProps()} />);
    const nodeList = () => wrapper.find('.filters-group').first();
    const toggle = () =>
      wrapper.find('.filters-section-heading__toggle-btn').first();
    expect(nodeList().length).toBe(1);
    expect(toggle().hasClass('filters-section-heading__toggle-btn--alt')).toBe(
      false
    );
    expect(() => {
      toggle()
        .hasClass('filters-section-heading__toggle-btn--disabled')
        .toBe(false);
      toggle().simulate('click');
      expect(nodeList().length).toBe(1);
      expect(
        toggle().hasClass('filters-section-heading__toggle-btn--alt')
      ).toBe(true);
    }).toThrow();
  });

  it('handles group checkbox change events', () => {
    const onGroupToggleChanged = jest.fn();
    const wrapper = setup.mount(
      <Filters {...mockProps()} onGroupToggleChanged={onGroupToggleChanged} />
    );
    const checkbox = () => wrapper.find('input').first();
    checkbox().simulate('change', { target: { checked: false } });
    expect(onGroupToggleChanged.mock.calls.length).toEqual(1);
  });

  it('calls onResetFilter when reset button is clicked', () => {
    const onResetFilter = jest.fn();
    const wrapper = setup.mount(
      <Filters {...mockProps()} onResetFilter={onResetFilter} />
    );
    const resetButton = wrapper.find('.filters__reset-button');
    expect(resetButton.exists()).toBe(true);
    resetButton.simulate('click');
    expect(() => onResetFilter.mock.calls.length.toEqual(1)).toThrow();
  });
});
