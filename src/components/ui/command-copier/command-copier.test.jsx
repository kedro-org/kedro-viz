import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommandCopier from './command-copier';

describe('CommandCopier', () => {
  const command = 'test command';

  beforeEach(() => {
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });
  });

  it('shows the node command', () => {
    render(<CommandCopier command={command} isCommand={true} />);
    expect(screen.getByText('test command')).toBeInTheDocument();
  });

  it('copies command when button clicked', () => {
    render(<CommandCopier command={command} isCommand={true} />);
    const copyButton = screen.getByRole('button', { name: /copy/i });

    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test command');
  });

  it('does not show copy icon when there is no command', () => {
    const { queryByRole } = render(
      <CommandCopier command={command} isCommand={false} />
    );

    expect(queryByRole('button', { name: /copy/i })).toBeNull();
  });
});
