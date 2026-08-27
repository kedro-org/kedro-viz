import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import IconButton from '.';
import MenuIcon from '../../icons/menu';

describe('IconButton', () => {
  it('renders without crashing', () => {
    render(
      <IconButton
        ariaLive="polite"
        ariaLabel="Change theme"
        onClick={() => {}}
        icon={MenuIcon}
        labelText="Toggle theme"
        visible={true}
      />
    );

    expect(
      screen.getByRole('button', { name: /change theme/i })
    ).toBeInTheDocument();
  });

  it('calls a function on click', () => {
    const onClick = jest.fn();
    render(<IconButton onClick={onClick} visible={true} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('hides when visibility is false', () => {
    const { container } = render(<IconButton visible={false} />);
    expect(container.querySelector('li')).not.toBeInTheDocument();
    expect(
      container.querySelector('.pipeline-icon-toolbar__button')
    ).not.toBeInTheDocument();
  });

  it('defaults labelTextPosition to "right"', () => {
    const { container } = render(
      <IconButton labelText="Toggle theme" visible={true} />
    );
    expect(
      container.querySelector('.pipeline-toolbar__label-right')
    ).toBeInTheDocument();
  });

  it('respects custom labelTextPosition (bottom)', () => {
    const { container } = render(
      <IconButton
        labelText="Toggle theme"
        labelTextPosition="bottom"
        visible={true}
      />
    );
    expect(
      container.querySelector('.pipeline-toolbar__label-bottom')
    ).toBeInTheDocument();
  });

  it('falls back to default labelTextPosition when invalid value is passed', () => {
    const { container } = render(
      <IconButton
        labelText="Toggle theme"
        labelTextPosition="random position"
        visible={true}
      />
    );
    expect(
      container.querySelector('.pipeline-toolbar__label-right')
    ).toBeInTheDocument();
  });

  it('shows tooltip on hover', async () => {
    jest.useFakeTimers();
    const { container } = render(
      <IconButton
        labelText="Toggle theme"
        labelTextPosition="random position"
        visible={true}
      />
    );

    const button = container.querySelector('.pipeline-icon-toolbar__button');
    expect(button).toBeInTheDocument();

    act(() => {
      fireEvent.mouseEnter(button);
      jest.runOnlyPendingTimers();
    });

    await waitFor(() =>
      expect(
        container.querySelector('.pipeline-toolbar__label__visible')
      ).toBeInTheDocument()
    );
  });

  it('does not show tooltip if the pointer leaves before the show delay elapses, even across a re-render', () => {
    jest.useFakeTimers();
    const { container, rerender } = render(
      <IconButton labelText="Toggle theme" active={false} visible={true} />
    );

    const button = container.querySelector('.pipeline-icon-toolbar__button');

    act(() => {
      fireEvent.mouseEnter(button);
    });

    // A re-render happens while the show-timeout is still pending (common in
    // kedro-viz as global store state updates on hover/layout changes).
    act(() => {
      rerender(
        <IconButton labelText="Toggle theme" active={true} visible={true} />
      );
    });

    act(() => {
      // Pointer leaves before the 333ms delay is up.
      fireEvent.mouseLeave(button);
      jest.runOnlyPendingTimers();
    });

    expect(
      container.querySelector('.pipeline-toolbar__label__visible')
    ).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('hides tooltip on mouse leave', () => {
    const { container } = render(
      <IconButton
        labelText="Toggle theme"
        labelTextPosition="random position"
        visible={true}
      />
    );

    const button = container.querySelector('.pipeline-icon-toolbar__button');
    fireEvent.mouseLeave(button);

    expect(
      container.querySelector('.pipeline-toolbar__label__visible')
    ).not.toBeInTheDocument();
  });
});
