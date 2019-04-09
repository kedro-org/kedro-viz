import React from 'react';
import { mount } from 'enzyme';
import $ from 'cheerio';
import { FlowChart, mapStateToProps, mapDispatchToProps } from './index';
import { mockState } from '../../utils/data.mock';
import { getLayout, getZoomPosition } from '../../selectors/layout';
import { getActiveSnapshotNodes } from '../../selectors/nodes';

function setup(visibleNav = true) {
  const props = {
    activeSnapshot: mockState.activeSnapshot,
    chartSize: mockState.chartSize,
    layout: getLayout(mockState),
    onToggleNodeActive: jest.fn(),
    onUpdateChartSize: jest.fn(),
    textLabels: mockState.textLabels,
    view: mockState.view,
    visibleNav,
    zoom: getZoomPosition(mockState)
  };

  const wrapper = mount(<FlowChart {...props} />);

  return {
    props,
    wrapper
  };
}

describe('FlowChart', () => {
  it('renders without crashing', () => {
    const svg = setup().wrapper.find('svg');
    expect(svg.length).toEqual(1);
    expect(svg.hasClass('pipeline-flowchart__graph')).toBe(true);
  });

  it('renders nodes with D3', () => {
    const { wrapper } = setup();
    const nodes = wrapper.render().find('.node');
    const nodeNames = nodes.map((i, el) => $(el).text()).get();
    const mockNodes = getActiveSnapshotNodes(mockState);
    const mockNodeNames = mockNodes.map(d => mockState.nodeName[d]);
    expect(nodes.length).toEqual(mockNodes.length);
    expect(nodeNames.sort()).toEqual(mockNodeNames.sort());
  });

  it('resizes the chart if the window resizes', () => {
    const map = {};
    window.addEventListener = jest.fn((event, cb) => {
      map[event] = cb;
    });
    const { wrapper } = setup();
    const spy = jest.spyOn(wrapper.instance(), 'updateChartSize');
    map.resize();
    expect(spy).toHaveBeenCalled();
  });

  describe('getNavOffset', () => {
    it("sets nav offset to zero if nav isn't visible", () => {
      const instance = setup(false).wrapper.instance();
      expect(instance.getNavOffset(1000)).toEqual(0);
    });

    it('sets nav offset to zero on mobile', () => {
      const instance = setup(true).wrapper.instance();
      expect(instance.getNavOffset(480)).toEqual(0);
      expect(instance.getNavOffset(320)).toEqual(0);
    });

    it('reduces the chart width by 300 if the nav is visible on wider screens', () => {
      const instance = setup(true).wrapper.instance();
      expect(instance.getNavOffset(1000)).toEqual(300);
      expect(instance.getNavOffset(500)).toEqual(300);
    });
  });

  it('removes the resize event listener on unmount', () => {
    const { wrapper } = setup();
    const spy = jest.spyOn(wrapper.instance(), 'componentWillUnmount');
    const spy2 = jest.spyOn(wrapper.instance(), 'updateChartSize');
    wrapper.unmount();
    expect(spy).toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
  });

  it('maps state to props', () => {
    const expectedResult = {
      activeSnapshot: expect.any(String),
      chartSize: expect.any(Object),
      layout: expect.objectContaining({
        edges: expect.any(Array),
        nodes: expect.any(Array)
      }),
      textLabels: expect.any(Boolean),
      view: expect.stringMatching(/combined|data|text/),
      zoom: expect.objectContaining({
        scale: expect.any(Number),
        translateX: expect.any(Number),
        translateY: expect.any(Number)
      })
    };
    expect(mapStateToProps(mockState)).toEqual(expectedResult);
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();

    mapDispatchToProps(dispatch).onToggleNodeActive({ id: '123' }, true);
    expect(dispatch.mock.calls[0][0]).toEqual({
      nodeID: '123',
      isActive: true,
      type: 'TOGGLE_NODE_ACTIVE'
    });

    const boundingClientRect = { x: 0, y: 0, width: 1000, height: 1000 };
    mapDispatchToProps(dispatch).onUpdateChartSize(boundingClientRect);
    expect(dispatch.mock.calls[1][0]).toEqual({
      chartSize: boundingClientRect,
      type: 'UPDATE_CHART_SIZE'
    });
  });
});
