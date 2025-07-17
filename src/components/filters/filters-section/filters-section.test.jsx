import React from 'react';
import { render } from '@testing-library/react';
import FiltersSection from './filters-section';
import { mockState } from '../../../utils/state.mock';
import { getNodeTypes } from '../../../selectors/node-types';
import { getGroupedNodes } from '../../../selectors/nodes';
import { getGroups } from '../../../selectors/filtered-node-list-items';

describe('FiltersSection Component', () => {
  const setupProps = () => {
    const items = getGroupedNodes(mockState.spaceflights);
    const nodeTypes = getNodeTypes(mockState.spaceflights);
    const groups = getGroups({ nodeTypes, items });
    return {
      items,
      group: groups['elementType'],
      groupCollapsed: {},
    };
  };

  it('renders without throwing', () => {
    const props = setupProps();
    const { container } = render(<FiltersSection {...props} />);
    expect(container.querySelector('.filters-section')).toBeInTheDocument();
  });

  it('adds class when allUnchecked is true', () => {
    const props = setupProps();
    props.group.allUnchecked = true;
    const { container } = render(<FiltersSection {...props} />);
    expect(container.querySelector('.filters-section')).toHaveClass(
      'filters-section--all-unchecked'
    );
  });
});
