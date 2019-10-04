import React from 'react';
import $ from 'cheerio';
import FlowChart, { mapStateToProps, mapDispatchToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

const getNodes = state => state.nodes;

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
    const mockNodes = getNodes(mockState.lorem);
    const mockNodeNames = mockNodes.map(d => mockState.lorem.nodeName[d]);
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

  describe('getNavOffset', () => {
    describe('if nav is visible', () => {
      it('reduces the chart width by 300 on wider screens', () => {
        const wrapper = setup.mount(<FlowChart visibleNav={true} />);
        const instance = wrapper.find('FlowChart').instance();
        expect(instance.getNavOffset(1000)).toEqual(300);
        expect(instance.getNavOffset(500)).toEqual(300);
      });

      it('sets nav offset to zero on mobile', () => {
        const instance = setup
          .mount(<FlowChart visibleNav={true} />)
          .find('FlowChart')
          .instance();
        expect(instance.getNavOffset(480)).toEqual(0);
        expect(instance.getNavOffset(320)).toEqual(0);
      });
    });

    describe('if nav is hidden', () => {
      const instance = setup
        .mount(<FlowChart visibleNav={false} />)
        .find('FlowChart')
        .instance();

      it('sets nav offset to zero on desktop', () => {
        expect(instance.getNavOffset(1000)).toEqual(0);
      });

      it('sets nav offset to zero on mobile', () => {
        expect(instance.getNavOffset(480)).toEqual(0);
        expect(instance.getNavOffset(320)).toEqual(0);
      });
    });
  });

  it('maps state to props', () => {
    const expectedResult = {
      chartSize: expect.any(Object),
      layout: expect.objectContaining({
        edges: expect.any(Array),
        nodes: expect.any(Array)
      }),
      linkedNodes: expect.any(Object),
      centralNode: null,
      textLabels: expect.any(Boolean),
      view: expect.stringMatching(/combined|data|text/),
      zoom: expect.objectContaining({
        scale: expect.any(Number),
        translateX: expect.any(Number),
        translateY: expect.any(Number)
      })
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
