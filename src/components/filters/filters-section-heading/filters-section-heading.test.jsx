import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import FiltersSectionHeading from './filters-section-heading';
import { mockState } from '../../../utils/state.mock';
import { getNodeTypes } from '../../../selectors/node-types';
import { getGroupedNodes } from '../../../selectors/nodes';
import { getGroups } from '../../../selectors/filtered-node-list-items';

describe('FiltersSectionHeading', () => {
  const getProps = () => {
    const items = getGroupedNodes(mockState.spaceflights);
    const nodeTypes = getNodeTypes(mockState.spaceflights);
    const groups = getGroups({ nodeTypes, items });
    return {
      group: groups['elementType'],
      groupItems: [{ id: 'fake', name: 'Fake', visible: true }],
      onGroupToggleChanged: jest.fn(),
      onToggleGroupCollapsed: jest.fn(),
      collapsed: false,
    };
  };

  it('renders without crashing', () => {
    const props = getProps();
    const { getByLabelText } = render(<FiltersSectionHeading {...props} />);
    expect(getByLabelText(/hide|show/i)).toBeInTheDocument();
  });

  it('calls onToggleGroupCollapsed when button is clicked', () => {
    const props = getProps();
    props.collapsed = false;
    const { getByLabelText } = render(<FiltersSectionHeading {...props} />);
    const toggleButton = getByLabelText(/hide element types/i); // matches aria-label
    fireEvent.click(toggleButton);
    expect(props.onToggleGroupCollapsed).toHaveBeenCalledTimes(1);
    expect(props.onToggleGroupCollapsed).toHaveBeenCalledWith(props.group.id);
  });

  it('adds class when collapsed is true', () => {
    const props = getProps();
    props.collapsed = true;
    const { container } = render(<FiltersSectionHeading {...props} />);
    expect(
      container.querySelector('.filters-section-heading__toggle-btn')
    ).toHaveClass('filters-section-heading__toggle-btn--alt');
  });

  it('adds class when disabled is true', () => {
    const props = getProps();
    props.groupItems = []; // triggers disabled
    const { container } = render(<FiltersSectionHeading {...props} />);
    expect(
      container.querySelector('.filters-section-heading__toggle-btn')
    ).toHaveClass('filters-section-heading__toggle-btn--disabled');
  });
});
