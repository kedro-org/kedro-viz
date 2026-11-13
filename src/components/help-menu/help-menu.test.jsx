import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import HelpMenu from './help-menu';

describe('HelpMenu', () => {
  const getButton = () =>
    screen.getByRole('button', { name: 'Help and resources' });

  const openMenu = () => fireEvent.click(getButton());

  it('renders the toolbar button with the menu closed', () => {
    render(<HelpMenu />);

    expect(getButton()).toHaveAttribute('aria-expanded', 'false');
    expect(getButton()).not.toHaveAttribute('aria-controls');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('opens the menu on button click', () => {
    render(<HelpMenu />);
    openMenu();

    expect(getButton()).toHaveAttribute('aria-expanded', 'true');
    const menuId = getButton().getAttribute('aria-controls');
    expect(document.getElementById(menuId)).toContainElement(
      screen.getAllByRole('link')[0]
    );
  });

  it.each([
    [
      'Report problem',
      'https://github.com/kedro-org/kedro-viz/issues/new?template=bug-report.md',
    ],
    [
      'Share idea',
      'https://github.com/kedro-org/kedro-viz/issues/new?template=feature-request.md',
    ],
    ['Kedro Docs', 'https://docs.kedro.org/'],
    ['Kedro Slack', 'https://slack.kedro.org/'],
  ])('points "%s" at %s', (label, href) => {
    render(<HelpMenu />);
    openMenu();

    expect(screen.getByRole('link', { name: label })).toHaveAttribute(
      'href',
      href
    );
  });

  it('opens every link in a new tab without leaking the opener', () => {
    render(<HelpMenu />);
    openMenu();

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('closes the menu on a second button click', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.click(getButton());

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('closes the menu when a link is followed', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.click(screen.getAllByRole('link')[0]);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('closes the menu on click outside', () => {
    render(<HelpMenu />);
    openMenu();
    fireEvent.click(document.body);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('keeps the menu open on click inside', () => {
    render(<HelpMenu />);
    openMenu();
    const menuId = getButton().getAttribute('aria-controls');
    fireEvent.click(document.getElementById(menuId));

    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('returns focus to the button when Escape closes a focused link', () => {
    render(<HelpMenu />);
    openMenu();
    screen.getAllByRole('link')[0].focus();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(getButton()).toHaveFocus();
  });

  it('leaves focus alone when Escape is pressed from elsewhere', () => {
    render(
      <>
        <HelpMenu />
        <button type="button">Elsewhere</button>
      </>
    );
    openMenu();
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    elsewhere.focus();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(elsewhere).toHaveFocus();
  });
});
