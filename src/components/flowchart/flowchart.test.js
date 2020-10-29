import React from 'react';
import $ from 'cheerio';
import FlowChart, { mapStateToProps, mapDispatchToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

const getNodeIDs = state => state.node.ids;
const getNodeName = state => state.node.name;
const getLayerIDs = state => state.layer.ids;

describe('FlowChart', () => {
  it('renders without crashing', () => {
    const svg = setup.mount(<FlowChart />).find('svg');
    expect(svg.length).toEqual(1);
    expect(svg.hasClass('pipeline-flowchart__graph')).toBe(true);
  });

  it('renders nodes with D3', () => {
    const wrapper = setup.mount(<FlowChart />);
    const nodes = wrapper.render().find('.pipeline-node');
    const nodeNames = nodes.map((i, el) => $(el).text()).get();
    const mockNodes = getNodeIDs(mockState.animals);
    const mockNodeNames = mockNodes.map(d => getNodeName(mockState.animals)[d]);
    expect(nodes.length).toEqual(mockNodes.length);
    expect(nodeNames.sort()).toEqual(mockNodeNames.sort());
  });

  it('resizes the chart if the window resizes', () => {
    const map = {};
    window.addEventListener = jest.fn((event, cb) => {
      map[event] = cb;
    });
    const wrapper = setup.mount(<FlowChart />);
    const spy = jest.spyOn(
      wrapper.find('FlowChart').instance(),
      'updateChartSize'
    );
    map.resize();
    expect(spy).toHaveBeenCalled();
  });

  it('removes the resize event listener on unmount', () => {
    const map = {};
    window.addEventListener = jest.fn((event, cb) => {
      map[event] = cb;
    });
    window.removeEventListener = jest.fn(event => {
      delete map[event];
    });
    const wrapper = setup.mount(<FlowChart />);
    const instance = wrapper.find('FlowChart').instance();
    const spy = jest.spyOn(instance, 'componentWillUnmount');
    const spy2 = jest.spyOn(instance, 'updateChartSize');
    expect(map.resize).toBeDefined();
    wrapper.unmount();
    expect(map.resize).toBeUndefined();
    if (map.resize) {
      map.resize();
    }
    expect(spy).toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
  });

  it('does not throw an error/warning when no data is displayed', () => {
    // Setup
    const originalConsole = console;
    console.warn = jest.fn();
    console.error = jest.fn();
    // Test
    const emptyData = { data: { nodes: [], edges: [] } };
    expect(() => setup.mount(<FlowChart />, emptyData)).not.toThrow();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    // Teardown
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  it('applies selected class to nodes when nodeSelected prop set', () => {
    const mockNodes = getNodeIDs(mockState.animals);
    const wrapper = setup.mount(
      <FlowChart
        nodeSelected={{
          [mockNodes[0]]: true,
          [mockNodes[1]]: true
        }}
      />
    );
    expect(wrapper.render().find('.pipeline-node--selected').length).toBe(2);
  });

  it('applies active class to nodes when nodeActive prop set', () => {
    const mockNodes = getNodeIDs(mockState.animals);
    const wrapper = setup.mount(
      <FlowChart
        nodeActive={{
          [mockNodes[0]]: true,
          [mockNodes[1]]: true
        }}
      />
    );
    expect(wrapper.render().find('.pipeline-node--active').length).toBe(2);
  });

  it('shows layers when layers are visible', () => {
    const mockLayers = getLayerIDs(mockState.animals);
    const wrapper = setup.mount(<FlowChart />);
    expect(wrapper.render().find('.pipeline-layer').length).toBe(
      mockLayers.length
    );
  });

  it('hides layers when layers.length is 0', () => {
    const wrapper = setup.mount(<FlowChart layers={[]} />);
    expect(wrapper.render().find('.pipeline-layer').length).toBe(0);
  });

  it('shows tooltip when tooltip prop set as visible', () => {
    const wrapper = setup.mount(
      <FlowChart
        tooltip={{
          targetRect: { top: 0, left: 0, width: 10, height: 10 },
          text: 'test tooltip',
          visible: true
        }}
      />
    );

    const tooltip = wrapper.render().find('.pipeline-tooltip');
    const tooltipText = wrapper.render().find('.pipeline-tooltip__text');
    expect(tooltip.hasClass('pipeline-tooltip--visible')).toBe(true);
    expect(tooltipText.text()).toBe('test tooltip');
  });

  it('hides tooltip when tooltip prop not set as visible', () => {
    const wrapper = setup.mount(
      <FlowChart
        tooltip={{
          targetRect: { top: 0, left: 0, width: 10, height: 10 },
          text: 'test tooltip',
          visible: false
        }}
      />
    );

    const tooltip = wrapper.render().find('.pipeline-tooltip');
    expect(tooltip.hasClass('pipeline-tooltip--visible')).toBe(false);
  });

  it('maps state to props', () => {
    const expectedResult = {
      centralNode: null,
      chartSize: expect.any(Object),
      chartZoom: expect.any(Object),
      edges: expect.any(Array),
      graphSize: expect.any(Object),
      layers: expect.any(Array),
      linkedNodes: expect.any(Object),
      nodeActive: expect.any(Object),
      nodeSelected: expect.any(Object),
      nodes: expect.any(Array),
      visibleSidebar: expect.any(Boolean)
    };
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();

    mapDispatchToProps(dispatch).onToggleNodeClicked('123');
    expect(dispatch.mock.calls[0][0]).toEqual({
      nodeClicked: '123',
      type: 'TOGGLE_NODE_CLICKED'
    });

    mapDispatchToProps(dispatch).onToggleNodeHovered('123');
    expect(dispatch.mock.calls[1][0]).toEqual({
      nodeHovered: '123',
      type: 'TOGGLE_NODE_HOVERED'
    });

    const boundingClientRect = { x: 0, y: 0, width: 1000, height: 1000 };
    mapDispatchToProps(dispatch).onUpdateChartSize(boundingClientRect);
    expect(dispatch.mock.calls[2][0]).toEqual({
      chartSize: boundingClientRect,
      type: 'UPDATE_CHART_SIZE'
    });

    const zoom = { scale: 1, x: 0, y: 0 };
    mapDispatchToProps(dispatch).onUpdateZoom(zoom);
    expect(dispatch.mock.calls[3][0]).toEqual({
      zoom,
      type: 'UPDATE_ZOOM'
    });
  });
});
