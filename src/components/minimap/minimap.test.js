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
    const nodes = wrapper.render().find('.pipeline-node');
    const mockNodes = getNodeIDs(mockState.lorem);
    expect(nodes.length).toEqual(mockNodes.length);
  });

  it('maps state to props', () => {
    const expectedResult = {
      centralNode: null,
      chartSize: expect.any(Object),
      chartZoom: expect.any(Object),
      graphSize: expect.any(Object),
      linkedNodes: expect.any(Object),
      nodeActive: expect.any(Object),
      nodeSelected: expect.any(Object),
      nodes: expect.any(Array),
      textLabels: expect.any(Boolean),
      zoom: expect.any(Object)
    };
    expect(mapStateToProps(mockState.lorem)).toEqual(expectedResult);
  });
});
