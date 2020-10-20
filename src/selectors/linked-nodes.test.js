import { getLinkedNodes } from './linked-nodes';
import { mockState } from '../utils/state.mock';
import { toggleNodeClicked } from '../actions/nodes';
import reducer from '../reducers';

describe('getLinkedNodes function', () => {
  const { nodes } = mockState.testData.graph;
  const nodeID = nodes.find(d => d.name.includes('salmon')).id;
  const newMockState = reducer(mockState.testData, toggleNodeClicked(nodeID));
  const linkedNodes = getLinkedNodes(newMockState);

  it('should return an object', () => {
    expect(linkedNodes).toEqual(expect.any(Object));
  });

  describe('should return true for ancestor/descendant nodes', () => {
    test.each([
      ['salmon', '4ffcf321'],
      ['pig', '2cd4ba93'],
      ['trout', '7196f150'],
      ['whale', '1769e230'],
      ['horse', '091b5035'],
      ['sheep', '6525f2e6'],
      ['cat', '9d989e8d'],
      ['dog', 'e4951252'],
      ['parameters', 'f1f1425b'],
      ['parameters_rabbit', '2a31900d']
    ])('node %s should be true', (name, id) => {
      expect(linkedNodes[id]).toBe(true);
    });
  });
});
