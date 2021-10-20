import { getLinkedNodes } from './linked-nodes';
import { mockState } from '../utils/state.mock';
import { toggleNodeClicked } from '../actions/nodes';
import reducer from '../reducers';

describe('getLinkedNodes function', () => {
  const { nodes } = mockState.spaceflights.graph;
  const nodeID = nodes.find((d) =>
    d.name.includes('Preprocess Companies Node')
  ).id;
  const newMockState = reducer(
    mockState.spaceflights,
    toggleNodeClicked(nodeID)
  );
  const linkedNodes = getLinkedNodes(newMockState);

  it('should return an object', () => {
    expect(linkedNodes).toEqual(expect.any(Object));
  });

  describe('should return true for ancestor/descendant nodes', () => {
    test.each([
      // ancestor
      ['Companies', '0abef172'],
      // descendants
      ['Preprocessed Companies', 'daf35ba0'],
      ['Regressor', '04424659'],
      ['Metrics', '966b9734'],
    ])('node %s should be true', (name, id) => {
      expect(linkedNodes[id]).toBe(true);
    });
  });

  describe('should not return any linked nodes for non-ancestor/descendant nodes', () => {
    test.each([
      ['Parameters', 'f1f1425b'],
      ['Shuttles', 'f192326a'],
      ['Preprocess Shuttles Node', 'b7bb7198'],
    ])('node %s should be false', (name, id) => {
      expect(linkedNodes[id]).toBe(undefined);
    });
  });
});
