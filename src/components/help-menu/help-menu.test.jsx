import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import HelpMenu, { helpMenuItems } from './help-menu';

describe('HelpMenu', () => {
  const openMenu = () =>
    fireEvent.click(screen.getByRole('button', { name: /open help/i }));

  it('renders the toolbar button with the menu closed', () => {
    render(<HelpMenu />);

    expect(
      screen.getByRole('button', { name: /open help and resources/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the menu on button click', () => {
    render(<HelpMenu />);
    openMenu();

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(helpMenuItems.length);
  });

  it('closes the menu on a second button click', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: /close help/i }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it.each(helpMenuItems)(
    'links "$label" to $href in a new tab',
    ({ href, label }) => {
      render(<HelpMenu />);
      openMenu();

      const link = screen.getByRole('menuitem', { name: label });
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  );

  it('closes the menu when a link is followed', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.click(screen.getAllByRole('menuitem')[0]);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the menu on click outside', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('keeps the menu open on click inside', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.mouseDown(screen.getByRole('menu'));

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes the menu on Escape', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
