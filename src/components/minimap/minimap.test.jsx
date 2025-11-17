import React from 'react';
import MiniMap, {
  MiniMap as UnconnectedMiniMap,
  mapStateToProps,
  mapDispatchToProps,
} from './minimap';
import { mockState, setup } from '../../utils/state.mock';
import { getViewTransform } from '../../utils/view';
import { getVisibleNodeIDs } from '../../selectors/disabled';
import { fireEvent, render } from '@testing-library/react';

describe('MiniMap', () => {
  it('renders without crashing', () => {
    const { container } = setup.render(<MiniMap />);
    const svg = container.querySelector('.pipeline-minimap__graph');
    expect(svg).toBeInTheDocument();
  });

  it('renders nodes with D3', () => {
    setup.render(<MiniMap />);
    const nodes = document.querySelectorAll('.pipeline-minimap-node');
    const mockNodes = getVisibleNodeIDs(mockState.spaceflights);
    expect(nodes.length).toEqual(mockNodes.length);
  });

  it('a transform to fit the graph in container was applied', () => {
    const ref = React.createRef();

    render(
      <UnconnectedMiniMap
        ref={ref}
        miniMapVisible={true}
        displayMiniMap={true}
        mapSize={{ width: 300, height: 200 }}
        chartSize={{ width: 800, height: 600, sidebarWidth: 0 }}
        chartZoom={{ x: 0, y: 0, scale: 1, applied: true }}
        graphSize={{ width: 400, height: 300 }}
        nodes={mockState.spaceflights.graph.nodes}
        linkedNodes={{}}
        nodeActive={{}}
        nodeSelected={{}}
        textLabels={false}
        onUpdateChartZoom={() => {}}
      />
    );

    ref.current.resetView();

    const { x, y, k } = getViewTransform(ref.current.view);
    expect(x).toBeLessThan(0);
    expect(y).toBeLessThan(0);
    expect(k).toBeGreaterThan(0);
    expect(k).toBeLessThan(1);
  });

  it('does not update nodes when not visible', () => {
    setup.render(<MiniMap miniMapVisible={false} />);
    const nodes = document.querySelectorAll('.pipeline-minimap-node');
    expect(nodes.length).toEqual(0);
  });

  it('adds and removes global wheel event handler', () => {
    const windowEvents = {};
    window.addEventListener = jest.fn(
      (e, callback) => (windowEvents[e] = callback)
    );
    window.removeEventListener = jest.fn((e) => delete windowEvents[e]);

    const { unmount } = setup.render(<MiniMap />);
    expect(() => windowEvents.wheel({ target: null })).not.toThrow();
    unmount();
    expect(windowEvents.wheel).toBeUndefined();
  });

  it('adds and removes pointer event handler when supported', () => {
    const windowEvents = {};
    window.addEventListener = jest.fn(
      (e, callback) => (windowEvents[e] = callback)
    );
    window.removeEventListener = jest.fn((e) => delete windowEvents[e]);
    window.PointerEvent = {};

    const { unmount } = setup.render(<MiniMap />);
    expect(windowEvents.mouseup).toBeUndefined();
    expect(() => windowEvents.pointerup()).not.toThrow();
    unmount();
    expect(windowEvents.pointerup).toBeUndefined();
  });

  it('adds and removes mouse event handler when pointer events not supported', () => {
    const windowEvents = {};
    window.addEventListener = jest.fn(
      (e, callback) => (windowEvents[e] = callback)
    );
    window.removeEventListener = jest.fn((e) => delete windowEvents[e]);
    window.PointerEvent = null;

    const { unmount } = setup.render(<MiniMap />);
    expect(windowEvents.mouseup).toBeDefined();
    expect(() => windowEvents.mouseup()).not.toThrow();
    unmount();
    expect(windowEvents.mouseup).toBeUndefined();
  });

  it('updates chart zoom on mouse interactions', () => {
    const onUpdateChartZoom = jest.fn();
    const { container } = setup.render(
      <MiniMap onUpdateChartZoom={onUpdateChartZoom} />
    );
    const minimap = container.querySelector('.pipeline-minimap');

    fireEvent.mouseEnter(minimap, { clientX: 5, clientY: 10 });
    fireEvent.mouseDown(minimap, { clientX: 5, clientY: 10 });
    fireEvent.mouseMove(minimap, { clientX: 10, clientY: 15 });
    fireEvent.mouseLeave(minimap, { clientX: 10, clientY: 15 });

    expect(onUpdateChartZoom).toHaveBeenLastCalledWith(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        scale: expect.any(Number),
        applied: expect.any(Boolean),
        transition: expect.any(Boolean),
        relative: expect.any(Boolean),
      })
    );
  });

  it('updates chart zoom scale on mouse wheel', () => {
    const onUpdateChartZoom = jest.fn();
    const { container } = setup.render(
      <MiniMap onUpdateChartZoom={onUpdateChartZoom} />
    );
    const minimap = container.querySelector('.pipeline-minimap');

    fireEvent.mouseEnter(minimap, { clientX: 5, clientY: 10 });
    fireEvent.wheel(minimap, { deltaY: 1 });
    fireEvent.mouseLeave(minimap, { clientX: 5, clientY: 10 });

    expect(onUpdateChartZoom).toHaveBeenLastCalledWith(
      expect.objectContaining({
        scale: expect.any(Number),
        applied: expect.any(Boolean),
        transition: expect.any(Boolean),
        relative: expect.any(Boolean),
      })
    );
  });

  it('handles empty data gracefully', () => {
    const originalWarn = console.warn;
    const originalError = console.error;
    console.warn = jest.fn();
    console.error = jest.fn();

    expect(() =>
      setup.render(<MiniMap />, { data: { nodes: [], edges: [] } })
    ).not.toThrow();

    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();

    console.warn = originalWarn;
    console.error = originalError;
  });

  it('maps state to props', () => {
    const result = mapStateToProps(mockState.spaceflights);
    expect(result).toEqual(
      expect.objectContaining({
        miniMapVisible: expect.any(Boolean),
        displayMiniMap: expect.any(Boolean),
        mapSize: expect.any(Object),
        clickedNode: null,
        chartSize: expect.any(Object),
        chartZoom: expect.any(Object),
        graphSize: expect.any(Object),
        linkedNodes: expect.any(Object),
        nodeActive: expect.any(Object),
        nodeSelected: expect.any(Object),
        nodes: expect.any(Array),
        textLabels: expect.any(Boolean),
      })
    );
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();
    const zoom = {};
    mapDispatchToProps(dispatch).onUpdateChartZoom(zoom);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_ZOOM', zoom });
  });
});
