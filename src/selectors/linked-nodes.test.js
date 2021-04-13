import { getLinkedNodes } from './linked-nodes';
import { mockState } from '../utils/state.mock';
import { toggleNodeClicked } from '../actions/nodes';
import reducer from '../reducers';

describe('getLinkedNodes function', () => {
  const { nodes } = mockState.animals.graph;
  const nodeID = nodes.find((d) => d.name.includes('salmon')).id;
  const newMockState = reducer(mockState.animals, toggleNodeClicked(nodeID));
  const linkedNodes = getLinkedNodes(newMockState);

  it('should return an object', () => {
    expect(linkedNodes).toEqual(expect.any(Object));
  });

  describe('should return true for ancestor/descendant nodes', () => {
    test.each([
      ['whale', '1769e230'],
      ['horse', '091b5035'],
      ['sheep', '6525f2e6'],
      ['cat', '9d989e8d'],
      ['dog', 'e4951252'],
      ['parameters', 'f1f1425b'],
    ])('node %s should be true', (name, id) => {
      expect(linkedNodes[id]).toBe(true);
    });
  });

  describe('should not return any linked nodes for non-ancestor/descendant nodes', () => {
    test.each([
      ['bear', '09f5edeb'],
      ['shark', '4f90af66'],
      ['weasel', '85c4cf64'],
    ])('node %s should be false', (name, id) => {
      expect(linkedNodes[id]).toBe(undefined);
    });
  });
});
