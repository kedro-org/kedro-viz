import React from 'react';
import FiltersSection from './filters-section';
import { mockState, setup } from '../../../utils/state.mock';
import { getNodeTypes } from '../../../selectors/node-types';
import { getGroupedNodes } from '../../../selectors/nodes';
import { getGroups } from '../../../selectors/filtered-node-list-items';

describe('FiltersSection Component', () => {
  const mockProps = () => {
    const items = getGroupedNodes(mockState.spaceflights);
    const nodeTypes = getNodeTypes(mockState.spaceflights);
    const groups = getGroups({ nodeTypes, items });
    return { items, group: groups['elementType'], groupCollapsed: {} };
  };

  it('renders without throwing', () => {
    expect(() =>
      setup.mount(<FiltersSection {...mockProps()} />)
    ).not.toThrow();
  });
  it('adds clas all-uncheckes when allUnchecked prop true', () => {
    const wrapper = setup.mount(<FiltersSection {...mockProps()} />);
    const children = wrapper.find('.filters-section');
    expect(children.hasClass('filters-section--all-unchecked')).toBe(true);
  });
});
