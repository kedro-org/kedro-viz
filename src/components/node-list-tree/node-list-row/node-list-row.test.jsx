import React from 'react';
import NodeListRow from './node-list-row';
import { setup } from '../../../utils/state.mock';
import userEvent from '@testing-library/user-event';

const mockProps = {
  name: 'Test Row',
  kind: 'modular-pipeline',
  active: false,
  disabled: false,
  selected: false,
  visible: true,
  onMouseEnter: jest.fn(),
  onMouseLeave: jest.fn(),
  onClick: jest.fn(),
  icon: null,
  type: 'modularPipeline',
  checked: true,
  focused: false,
};

describe('NodeListRow Component', () => {
  it('renders without crashing', () => {
    expect(() => setup.render(<NodeListRow {...mockProps} />)).not.toThrow();
  });

  it('handles mouseenter events', async () => {
    const { container } = setup.render(<NodeListRow {...mockProps} />);
    const nodeRow = container.querySelector('.node-list-row');
    await userEvent.hover(nodeRow);
    expect(mockProps.onMouseEnter).toHaveBeenCalled();
  });

  it('handles mouseleave events', async () => {
    const { container } = setup.render(<NodeListRow {...mockProps} />);
    const nodeRow = container.querySelector('.node-list-row');
    await userEvent.unhover(nodeRow);
    expect(mockProps.onMouseLeave).toHaveBeenCalled();
  });

  it('applies the node-list-row--active class when active is true', () => {
    const { container } = setup.render(
      <NodeListRow {...mockProps} active={true} />
    );
    expect(container.querySelector('.node-list-row')).toHaveClass(
      'node-list-row--active'
    );
  });

  it('applies the node-list-row--selected class when selected is true', () => {
    const { container } = setup.render(
      <NodeListRow {...mockProps} selected={true} />
    );
    expect(container.querySelector('.node-list-row')).toHaveClass(
      'node-list-row--selected'
    );
  });

  it('applies node-list-row--selected when highlight is true and isSlicingPipelineApplied is false', () => {
    const { container } = setup.render(
      <NodeListRow
        {...mockProps}
        highlight={true}
        isSlicingPipelineApplied={false}
      />
    );
    expect(container.querySelector('.node-list-row')).toHaveClass(
      'node-list-row--selected'
    );
  });

  it('applies node-list-row--overwrite if not selected or active', () => {
    const { container } = setup.render(
      <NodeListRow {...mockProps} selected={false} active={false} />
    );
    expect(container.querySelector('.node-list-row')).toHaveClass(
      'node-list-row--overwrite'
    );
  });
});
