import { getLinkedNodes } from './linked-nodes';
import { getLayout } from './layout';
import { mockState } from '../utils/state.mock';
import { toggleNodeFocused } from '../actions';
import reducer from '../reducers';

describe('getLinkedNodes function', () => {
  it('should search through edges for ancestor and descendant nodes', () => {
    const { nodes } = getLayout(mockState);
    const nodeID = nodes.find(d => d.id.includes('salmon')).id;
    const newMockState = reducer(mockState, toggleNodeFocused(nodeID));
    const linkedNodes = getLinkedNodes(newMockState);
    expect(linkedNodes).toEqual(expect.any(Object));
    expect(linkedNodes['123456789012345/task/salmon']).toBe(true);
    expect(linkedNodes['123456789012345/data/pig']).toBe(true);
    expect(linkedNodes['123456789012345/task/trout']).toBe(true);
    expect(linkedNodes['123456789012345/data/whale']).toBe(true);
    expect(linkedNodes['123456789012345/data/horse']).toBe(true);
    expect(linkedNodes['123456789012345/data/sheep']).toBe(true);
    expect(linkedNodes['123456789012345/data/cat']).toBe(true);
    expect(linkedNodes['123456789012345/data/dog']).toBe(true);
    expect(linkedNodes['123456789012345/data/parameters']).toBe(true);
    expect(linkedNodes['123456789012345/data/parameters_rabbit']).toBe(true);
  });
});
