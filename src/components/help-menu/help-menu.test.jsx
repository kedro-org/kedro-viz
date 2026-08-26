import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import HelpMenu, { helpMenuItems } from './help-menu';

describe('HelpMenu', () => {
  const getButton = () =>
    screen.getByRole('button', { name: 'Help and resources' });

  const openMenu = () => fireEvent.click(getButton());

  it('renders the toolbar button with the menu closed', () => {
    render(<HelpMenu />);

    expect(getButton()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('opens the menu on button click', () => {
    render(<HelpMenu />);
    openMenu();

    expect(getButton()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link')).toHaveLength(helpMenuItems.length);
  });

  it('points the button at the menu it controls', () => {
    render(<HelpMenu />);
    openMenu();

    const menuId = getButton().getAttribute('aria-controls');
    expect(document.getElementById(menuId)).toContainElement(
      screen.getAllByRole('link')[0]
    );
  });

  it('closes the menu on a second button click', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.click(getButton());

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it.each(helpMenuItems)(
    'links "$label" to $href in a new tab',
    ({ href, label }) => {
      render(<HelpMenu />);
      openMenu();

      const link = screen.getByRole('link', { name: label });
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  );

  it('closes the menu when a link is followed', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.click(screen.getAllByRole('link')[0]);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('closes the menu on click outside', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('keeps the menu open on click inside', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.mouseDown(screen.getAllByRole('link')[0]);

    expect(screen.getAllByRole('link')).toHaveLength(helpMenuItems.length);
  });

  it('closes the menu on Escape', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('returns focus to the button when Escape closes a focused link', () => {
    render(<HelpMenu />);
    openMenu();
    screen.getAllByRole('link')[0].focus();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(getButton()).toHaveFocus();
  });
});
