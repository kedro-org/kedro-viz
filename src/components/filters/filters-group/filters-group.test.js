import React from 'react';
import FiltersGroup from './filters-group';
import { mockState, setup } from '../../../utils/state.mock';
import { getNodeTypes } from '../../../selectors/node-types';
import { getGroupedNodes } from '../../../selectors/nodes';
import { getGroups } from '../../../selectors/filtered-node-list-items';

describe('FiltersGroup Component', () => {
  const mockProps = () => {
    const items = getGroupedNodes(mockState.spaceflights);
    const nodeTypes = getNodeTypes(mockState.spaceflights);
    const groups = getGroups({ nodeTypes, items });
    return { group: groups['tags'], items: [] };
  };

  it('renders without throwing', () => {
    expect(() => setup.mount(<FiltersGroup {...mockProps()} />)).not.toThrow();
  });
  it('adds class when collapsed prop true', () => {
    const wrapper = setup.mount(
      <FiltersGroup {...mockProps()} collapsed={true} />
    );
    const children = wrapper.find('.filters-group');
    expect(children.hasClass('filters-group--closed')).toBe(true);
  });

  it('removes class when collapsed prop false', () => {
    const wrapper = setup.mount(
      <FiltersGroup {...mockProps()} collapsed={false} />
    );
    const children = wrapper.find('.filters-group');
    expect(children.hasClass('filters-group--closed')).toBe(false);
  });
});
