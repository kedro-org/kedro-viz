import { getLinkedNodes } from './linked-nodes';
import { getLayout } from '../../selectors/layout';
import { mockState } from '../../utils/state.mock';

describe('getLinkedNodes function', () => {
  it('should search through edges for ancestor and descendant nodes', () => {
    const { nodes, edges } = getLayout(mockState);
    const nodeID = nodes.find(d => d.id.includes('salmon')).id;
    const linkedNodeIDs = getLinkedNodes(edges, nodeID);
    expect(linkedNodeIDs).toEqual(expect.arrayContaining([expect.any(String)]));
    const includesNode = name =>
      linkedNodeIDs.filter(d => d.includes(name)).length > 0;
    expect(includesNode('trout')).toBe(true);
    expect(includesNode('shark')).toBe(false);
    expect(includesNode('sheep')).toBe(true);
    expect(includesNode('dog')).toBe(true);
    expect(includesNode('whale')).toBe(true);
    expect(includesNode('bear')).toBe(false);
  });
});
