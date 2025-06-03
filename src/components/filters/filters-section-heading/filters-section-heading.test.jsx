import React from 'react';
import FiltersSectionHeading from './filters-section-heading';
import { mockState, setup } from '../../../utils/state.mock';
import { getNodeTypes } from '../../../selectors/node-types';
import { getGroupedNodes } from '../../../selectors/nodes';
import { getGroups } from '../../../selectors/filtered-node-list-items';

describe('FiltersSectionHeading', () => {
  const mockProps = () => {
    const items = getGroupedNodes(mockState.spaceflights);
    const nodeTypes = getNodeTypes(mockState.spaceflights);
    const groups = getGroups({ nodeTypes, items });
    return { group: groups['elementType'], groupItems: [] };
  };

  it('renders without throwing', () => {
    expect(() =>
      setup.mount(<FiltersSectionHeading {...mockProps()} />)
    ).not.toThrow();
  });

  it('handles collapse button click events', () => {
    const onToggleCollapsed = jest.fn();
    const wrapper = setup.mount(
      <FiltersSectionHeading
        {...mockProps()}
        onToggleCollapsed={onToggleCollapsed}
      />
    );
    wrapper.find('.filters-section-heading__toggle-btn').simulate('click');
    expect(() => onToggleCollapsed.mock.calls.length.toEqual(1)).toThrow();
  });

  it('adds class when collapsed prop true', () => {
    const wrapper = setup.mount(
      <FiltersSectionHeading {...mockProps()} collapsed={true} />
    );
    const children = wrapper.find('.filters-section-heading__toggle-btn');
    expect(children.hasClass('filters-section-heading__toggle-btn--alt')).toBe(
      true
    );
  });

  it('adds class when disabled prop true', () => {
    const wrapper = setup.mount(
      <FiltersSectionHeading {...mockProps()} disabled={true} />
    );
    const children = wrapper.find('.filters-section-heading__toggle-btn');
    expect(
      children.hasClass('filters-section-heading__toggle-btn--disabled')
    ).toBe(true);
  });
});
