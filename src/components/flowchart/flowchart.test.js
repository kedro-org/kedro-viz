import React from 'react';
import { mount } from 'enzyme';
import $ from 'cheerio';
import { FlowChart, mapStateToProps, mapDispatchToProps } from './index';
import { mockState } from '../../utils/data.mock';
import { getLayout, getZoomPosition } from '../../selectors/layout';
import { getActiveSnapshotNodes } from '../../selectors/nodes';

function setup() {
  const props = {
    activeSnapshot: mockState.activeSnapshot,
    chartSize: mockState.chartSize,
    layout: getLayout(mockState),
    onToggleNodeActive: jest.fn(),
    onUpdateChartSize: jest.fn(),
    textLabels: mockState.textLabels,
    view: mockState.view,
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
