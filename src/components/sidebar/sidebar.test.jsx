import React from 'react';
import { Sidebar } from './sidebar';
import { setup } from '../../utils/state.mock';

const mockProps = (visible, onToggle = jest.fn()) => ({
  displayGlobalNavigation: true,
  displayFilterBtn: true,
  visible,
  onToggle,
});

describe('Sidebar', () => {
  it('renders without crashing', () => {
    const { container } = setup.render(<Sidebar {...mockProps(true)} />);
    expect(container.querySelector('.pipeline-sidebar')).toBeInTheDocument();
  });

  it('is open by default', () => {
    const { container } = setup.render(<Sidebar {...mockProps(true)} />);
    expect(container.querySelector('.pipeline-sidebar')).toHaveClass(
      'pipeline-sidebar--visible'
    );
  });

  it('renders with visible class when visible=true', () => {
    const { container } = setup.render(<Sidebar visible={true} />);
    const sidebar = container.querySelector('.pipeline-sidebar');
    expect(sidebar).toHaveClass('pipeline-sidebar--visible');
  });

  it('does not render visible class when visible=false', () => {
    const { container } = setup.render(<Sidebar visible={false} />);
    const sidebar = container.querySelector('.pipeline-sidebar');
    expect(sidebar).not.toHaveClass('pipeline-sidebar--visible');
  });
});
