import React from 'react';
import ConnectedModal, {
  ChonkyModal,
  mapStateToProps,
  mapDispatchToProps
} from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('chonky modal', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<ConnectedModal />);
    expect(wrapper.find('.renderButton').length).toBe(1);
  });

  it('clicking the render anyways button will toggle the graph to display', () => {
    const mockFn = jest.fn();
    const props = {
      onToggleDisplayChonkyGraph: mockFn
    };
    const wrapper = setup.mount(<ChonkyModal {...props} />);

    wrapper.find('.renderButton').simulate('click');
    expect(mockFn.mock.calls.length).toBe(1);
  });

  it('maps state to props', () => {
    const expectedResult = {
      nodesNo: expect.any(Number),
      edgesNo: expect.any(Number)
    };
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });

  it('mapDispatchToProps', () => {
    const dispatch = jest.fn();
    const expectedResult = {
      onToggleDisplayChonkyGraph: expect.any(Function)
    };
    expect(mapDispatchToProps(dispatch)).toEqual(expectedResult);
  });
});
