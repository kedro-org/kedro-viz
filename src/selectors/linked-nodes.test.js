import { getLinkedNodes } from './linked-nodes';
import { mockState } from '../utils/state.mock';
import { toggleNodeClicked } from '../actions/nodes';
import reducer from '../reducers';

describe('getLinkedNodes function', () => {
  it('should search through edges for ancestor and descendant nodes', () => {
    const { nodes } = mockState.testData.graph;
    const nodeID = nodes.find(d => d.id.includes('4ffcf321')).id;
    const newMockState = reducer(mockState.testData, toggleNodeClicked(nodeID));
    const linkedNodes = getLinkedNodes(newMockState);
    expect(linkedNodes).toEqual(expect.any(Object));
    expect(linkedNodes['4ffcf321']).toBe(true);
    expect(linkedNodes['2cd4ba93']).toBe(true);
    expect(linkedNodes['7196f150']).toBe(true);
    expect(linkedNodes['1769e230']).toBe(true);
    expect(linkedNodes['091b5035']).toBe(true);
    expect(linkedNodes['6525f2e6']).toBe(true);
    expect(linkedNodes['9d989e8d']).toBe(true);
    expect(linkedNodes['e4951252']).toBe(true);
    expect(linkedNodes['f1f1425b']).toBe(true);
    expect(linkedNodes['2a31900d']).toBe(true);
  });
});
