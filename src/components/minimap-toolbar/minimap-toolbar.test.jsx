import React from 'react';
import { fireEvent } from '@testing-library/react';
import ConnectedMiniMapToolbar, {
  MiniMapToolbar,
  mapStateToProps,
  mapDispatchToProps,
} from './minimap-toolbar';
import { mockState, setup } from '../../utils/state.mock';

describe('MiniMapToolbar', () => {
  it('renders without crashing', () => {
    const { container } = setup.render(<ConnectedMiniMapToolbar />);
    const buttons = container.querySelectorAll(
      '.pipeline-icon-toolbar__button'
    );
    expect(buttons.length).toBe(4);
  });

  const functionCalls = [
    ['.pipeline-minimap-button--map', 'onToggleMiniMap'],
    ['.pipeline-minimap-button--zoom-in', 'onUpdateChartZoom'],
    ['.pipeline-minimap-button--zoom-out', 'onUpdateChartZoom'],
    ['.pipeline-minimap-button--reset', 'onUpdateChartZoom'],
  ];

  test.each(functionCalls)(
    'calls %s function on %s button click',
    (selector, callback) => {
      const mockFn = jest.fn();
      const props = {
        chartZoom: { scale: 1, minScale: 0.5, maxScale: 1.5 },
        displayMiniMap: true,
        visible: { miniMap: false },
        [callback]: mockFn,
      };

      const { container } = setup.render(<MiniMapToolbar {...props} />);
      const buttonWrapper = container.querySelector(selector);
      expect(buttonWrapper).not.toBeNull();

      const button =
        buttonWrapper.querySelector('button') ??
        buttonWrapper.closest('button') ??
        buttonWrapper;

      fireEvent.click(button);
      expect(mockFn).toHaveBeenCalledTimes(1);
    }
  );

  it('does not display the toggle minimap button if displayMiniMap is false', () => {
    const props = {
      chartZoom: { scale: 1, minScale: 0.5, maxScale: 1.5 },
      displayMiniMap: false,
      visible: { miniMap: false },
    };

    const { container } = setup.render(<MiniMapToolbar {...props} />);
    expect(container.querySelector('.pipeline-minimap-button--map')).toBeNull();
  });

  it('maps state to props', () => {
    const expectedResult = {
      displayMiniMap: true,
      chartZoom: expect.any(Object),
      displayZoomToolbar: expect.any(Boolean),
      visible: expect.objectContaining({
        miniMap: expect.any(Boolean),
      }),
    };
    expect(mapStateToProps(mockState.spaceflights)).toEqual(expectedResult);
  });

  it('mapDispatchToProps', () => {
    const dispatch = jest.fn();
    const result = mapDispatchToProps(dispatch);

    expect(result).toEqual({
      onToggleMiniMap: expect.any(Function),
      onUpdateChartZoom: expect.any(Function),
    });

    result.onUpdateChartZoom({ scale: 1 });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_ZOOM',
      zoom: { scale: 1 },
    });
  });
});
