import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import SplitPanel from './split-panel';

describe('SplitPanel', () => {
  const mockRects = {
    container: {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
    },
    handle: {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 0,
    },
  };

  const mockBoundingRects = () => {
    Element.prototype.getBoundingClientRect = function () {
      if (this.className.includes('split-panel__container')) {
        return mockRects.container;
      }
      if (this.className.includes('split-panel__handle')) {
        return mockRects.handle;
      }
      return { width: 0, height: 0 };
    };
  };

  const renderSplitPanel = (props = {}) =>
    render(
      <SplitPanel {...props}>
        {({
          split,
          isResizing,
          props: { container, panelA, panelB, handle },
        }) => (
          <div
            className="split-panel__container"
            data-testid="container"
            data-is-resizing={isResizing}
            data-split={split}
            {...container}
          >
            <div
              className="split-panel__panel-a"
              data-testid="panel-a"
              {...panelA}
            />
            <div
              className="split-panel__handle"
              data-testid="handle"
              {...handle}
            />
            <div
              className="split-panel__panel-b"
              data-testid="panel-b"
              {...panelB}
            />
          </div>
        )}
      </SplitPanel>
    );

  beforeEach(() => mockBoundingRects());

  it('renders without crashing', () => {
    const { getByTestId } = renderSplitPanel();
    expect(getByTestId('panel-a')).toBeInTheDocument();
    expect(getByTestId('panel-b')).toBeInTheDocument();
    expect(getByTestId('handle')).toBeInTheDocument();
  });

  it('moves the split on mousedown/mousemove/mouseup', () => {
    const { getByTestId } = renderSplitPanel({
      splitDefault: 0.5,
      splitMin: 0,
      splitMax: 1,
    });

    const container = getByTestId('container');
    const handle = getByTestId('handle');
    const panelA = getByTestId('panel-a');
    const panelB = getByTestId('panel-b');

    // Simulate drag
    fireEvent.mouseDown(handle, { clientY: 60 });
    expect(container.getAttribute('data-is-resizing')).toBe('true');

    fireEvent.mouseMove(handle, { clientY: 70 });
    fireEvent.mouseUp(handle, { clientY: 70 });

    expect(container.getAttribute('data-is-resizing')).toBe('false');
    expect(parseFloat(panelA.style.height)).toBeCloseTo(70);
    expect(parseFloat(panelB.style.height)).toBeCloseTo(30);
  });

  it('moves the split with keyboard arrows', () => {
    const keyboardStep = 0.025;
    const { getByTestId } = renderSplitPanel({
      splitDefault: 0.5,
      splitMin: 0,
      splitMax: 1,
      keyboardStep,
    });

    const handle = getByTestId('handle');
    const panelA = getByTestId('panel-a');
    const panelB = getByTestId('panel-b');

    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(parseFloat(panelA.style.height)).toBeCloseTo(52.5);
    expect(parseFloat(panelB.style.height)).toBeCloseTo(47.5);

    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(parseFloat(panelA.style.height)).toBeCloseTo(50);
    expect(parseFloat(panelB.style.height)).toBeCloseTo(50);
  });
});
