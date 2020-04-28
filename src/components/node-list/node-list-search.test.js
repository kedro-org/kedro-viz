import { NodeListSearch, mapStateToProps } from './node-list-search';
import { mockState, setup } from '../../utils/state.mock';

describe('NodeListSearch', () => {
  it('renders without crashing', () => {
    const wrapper = setup.shallow(NodeListSearch);
    const search = wrapper.find('.pipeline-nodelist-search');
    expect(search.length).toBe(1);
  });

  it('handles escape key events', () => {
    const onUpdateSearchValue = jest.fn();
    const wrapper = setup.shallow(NodeListSearch, { onUpdateSearchValue });
    const search = wrapper.find('.pipeline-nodelist-search');
    search.simulate('keydown', { keyCode: 27 });
    expect(onUpdateSearchValue.mock.calls.length).toBe(1);
  });

  it('maps state to props', () => {
    const expectedResult = {
      theme: expect.any(String)
    };
    expect(mapStateToProps(mockState.lorem)).toEqual(expectedResult);
  });
});
