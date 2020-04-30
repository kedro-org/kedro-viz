import React from 'react';
import $ from 'cheerio';
import FlowChart, { mapStateToProps, mapDispatchToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

const getNodeIDs = state => state.node.ids;
const getNodeName = state => state.node.name;

describe('FlowChart', () => {
  it('renders without crashing', () => {
    const svg = setup.mount(<FlowChart />).find('svg');
    expect(svg.length).toEqual(1);
    expect(svg.hasClass('pipeline-flowchart__graph')).toBe(true);
  });

  it('renders nodes with D3', () => {
    const wrapper = setup.mount(<FlowChart />);
    const nodes = wrapper.render().find('.node');
    const nodeNames = nodes.map((i, el) => $(el).text()).get();
    const mockNodes = getNodeIDs(mockState.lorem);
    const mockNodeNames = mockNodes.map(d => getNodeName(mockState.lorem)[d]);
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

  it('maps state to props', () => {
    const expectedResult = {
      centralNode: null,
      chartSize: expect.any(Object),
      edges: expect.any(Array),
      graphSize: expect.any(Object),
      layers: expect.any(Array),
      linkedNodes: expect.any(Object),
      nodeActive: expect.any(Object),
      nodeSelected: expect.any(Object),
      nodes: expect.any(Array),
      textLabels: expect.any(Boolean),
      visibleLayers: expect.any(Boolean),
      visibleSidebar: expect.any(Boolean),
      zoom: expect.any(Object)
    };
    expect(mapStateToProps(mockState.lorem)).toEqual(expectedResult);
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
  });
});
