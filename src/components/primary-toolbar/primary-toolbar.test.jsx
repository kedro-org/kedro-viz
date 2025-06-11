import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PrimaryToolbar from './primary-toolbar';

describe('PrimaryToolbar', () => {
  it('renders without crashing', () => {
    render(<PrimaryToolbar />);
    expect(screen.getAllByRole('button').length).toBe(1);
  });

  it('shows the collapse sidebar icon button', () => {
    render(<PrimaryToolbar visible={{ sidebar: true }} />);
    expect(screen.getAllByRole('button').length).toBe(1);
  });

  it('does not show the inverse menu button when sidebar is visible', () => {
    render(<PrimaryToolbar visible={{ sidebar: true }} />);
    expect(
      screen.queryByRole('button', { name: /toggle menu/i })
    ).not.toBeInTheDocument();
  });

  it('shows the inverse menu buttons when sidebar is hidden', () => {
    const { container } = render(
      <PrimaryToolbar visible={{ sidebar: false }} />
    );
    const inverseButtons = container.querySelectorAll(
      '.pipeline-menu-button--inverse'
    );
    expect(inverseButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onToggleSidebar on menu button click', () => {
    const mockFn = jest.fn();
    render(
      <PrimaryToolbar
        visible={{ sidebar: true }}
        onToggleSidebar={mockFn}
        displaySidebar={true}
        textLabels={false}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockFn).toHaveBeenCalled();
  });
});
