import React from 'react';
import { render } from '@testing-library/react';
import FiltersGroup from './filters-group';
import { mockState } from '../../../utils/state.mock';
import { getNodeTypes } from '../../../selectors/node-types';
import { getGroupedNodes } from '../../../selectors/nodes';
import { getGroups } from '../../../selectors/filtered-node-list-items';

describe('FiltersGroup Component', () => {
  const setupProps = () => {
    const items = getGroupedNodes(mockState.spaceflights);
    const nodeTypes = getNodeTypes(mockState.spaceflights);
    const groups = getGroups({ nodeTypes, items });
    return {
      group: groups['tags'],
      items: items['tags'] || [],
    };
  };

  it('renders without crashing', () => {
    const props = setupProps();
    const { container } = render(<FiltersGroup {...props} />);
    expect(container.querySelector('.filters-group')).toBeInTheDocument();
  });

  it('adds class when collapsed prop is true', () => {
    const props = setupProps();
    const { container } = render(<FiltersGroup {...props} collapsed={true} />);
    const groupElement = container.querySelector('.filters-group');
    expect(groupElement).toHaveClass('filters-group--closed');
  });

  it('does not have class when collapsed prop is false', () => {
    const props = setupProps();
    const { container } = render(<FiltersGroup {...props} collapsed={false} />);
    const groupElement = container.querySelector('.filters-group');
    expect(groupElement).not.toHaveClass('filters-group--closed');
  });
});
