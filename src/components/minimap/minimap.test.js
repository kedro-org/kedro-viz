import React from 'react';
import MiniMap, { mapStateToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

const getNodeIDs = state => state.node.ids;

describe('MiniMap', () => {
  it('renders without crashing', () => {
    const svg = setup.mount(<MiniMap />).find('svg');
    expect(svg.length).toEqual(1);
    expect(svg.hasClass('pipeline-minimap__graph')).toBe(true);
  });

  it('renders nodes with D3', () => {
    const wrapper = setup.mount(<MiniMap />);
    const nodes = wrapper.render().find('.pipeline-minimap-node');
    const mockNodes = getNodeIDs(mockState.animals);
    expect(nodes.length).toEqual(mockNodes.length);
  });

  it('does not throw an error/warning when no data is displayed', () => {
    // Setup
    const originalConsole = console;
    console.warn = jest.fn();
    console.error = jest.fn();
    // Test
    const emptyData = { data: { nodes: [], edges: [] } };
    expect(() => setup.mount(<MiniMap />, emptyData)).not.toThrow();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    // Teardown
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  it('maps state to props', () => {
    const expectedResult = {
      visible: expect.any(Boolean),
      mapSize: expect.any(Object),
      centralNode: null,
      chartSize: expect.any(Object),
      chartZoom: expect.any(Object),
      graphSize: expect.any(Object),
      linkedNodes: expect.any(Object),
      nodeActive: expect.any(Object),
      nodeSelected: expect.any(Object),
      nodes: expect.any(Array),
      textLabels: expect.any(Boolean)
    };
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });
});
