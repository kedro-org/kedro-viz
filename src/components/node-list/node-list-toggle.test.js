import { NodeListToggleAll, mapDispatchToProps } from './node-list-toggle';
import { setup } from '../../utils/state.mock';

describe('NodeListToggleAll', () => {
  it('renders without crashing', () => {
    const wrapper = setup.shallow(NodeListToggleAll);
    expect(wrapper.find('.pipeline-nodelist__toggle').length).toBe(1);
  });

  it('handles button click events', () => {
    const onToggleNodesDisabled = jest.fn();
    const wrapper = setup.shallow(NodeListToggleAll, { onToggleNodesDisabled });
    const button = wrapper.find('.pipeline-nodelist__toggle__button').first();
    button.simulate('click');
    expect(onToggleNodesDisabled.mock.calls.length).toBe(1);
  });

  describe('maps dispatch to props', () => {
    it('toggles nodes disabled', () => {
      const nodeIDs = ['123'];
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleNodesDisabled(nodeIDs, true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        nodeIDs,
        isDisabled: true,
        type: 'TOGGLE_NODES_DISABLED'
      });
    });
  });
});
