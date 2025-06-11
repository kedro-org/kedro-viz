import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Filters from './filters';
import { mockState } from '../../utils/state.mock';
import { getNodeTypes } from '../../selectors/node-types';
import { getGroupedNodes } from '../../selectors/nodes';
import { getGroups } from '../../selectors/filtered-node-list-items';

describe('Filters', () => {
  const getProps = (overrides = {}) => {
    const items = getGroupedNodes(mockState.spaceflights);
    const nodeTypes = getNodeTypes(mockState.spaceflights);
    const groups = getGroups({ nodeTypes, items });
    return {
      items,
      groups,
      groupCollapsed: {},
      onGroupToggleChanged: jest.fn(),
      onItemChange: jest.fn(),
      onResetFilter: jest.fn(),
      onToggleGroupCollapsed: jest.fn(),
      searchValue: '',
      isResetFilterActive: true,
      ...overrides,
    };
  };

  it('renders without crashing', () => {
    const props = getProps();
    const { container } = render(<Filters {...props} />);
    expect(container).toBeInTheDocument();
  });

  it('handles group checkbox change events', () => {
    const onGroupToggleChanged = jest.fn();
    const props = getProps({ onGroupToggleChanged });
    const { getAllByRole } = render(<Filters {...props} />);

    const checkboxes = getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    fireEvent.click(checkboxes[0]);

    expect(onGroupToggleChanged).toHaveBeenCalledTimes(1);
  });

  it('calls onResetFilter when reset button is clicked', () => {
    const onResetFilter = jest.fn();
    const props = getProps({ onResetFilter, isResetFilterActive: true });
    const { getByRole } = render(<Filters {...props} />);

    const resetButton = getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    expect(onResetFilter).toHaveBeenCalledTimes(1);
  });
});
