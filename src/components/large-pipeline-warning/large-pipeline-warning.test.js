import React from 'react';
import ConnectedModal, {
  LargePipelineWarning,
  mapStateToProps,
  mapDispatchToProps
} from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('large modal', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<ConnectedModal />);
    expect(wrapper.find('.pipeline-warning__title').length).toBe(1);
  });

  it('clicking the render anyways button will toggle the graph to display', () => {
    const mockFn = jest.fn();
    const props = {
      onToggleDisplayLargeGraph: mockFn,
      nodes: {
        data: [],
        parameters: [],
        task: []
      }
    };
    const wrapper = setup.mount(<LargePipelineWarning {...props} />);

    wrapper.find('.kui-button__btn').simulate('click');
    expect(mockFn.mock.calls.length).toBe(1);
  });

  it('maps state to props', () => {
    const expectedResult = {
      theme: expect.any(String),
      nodes: expect.any(Object),
      sidebarVisible: expect.any(Boolean)
    };
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });

  it('mapDispatchToProps', () => {
    const dispatch = jest.fn();
    const expectedResult = {
      onToggleDisplayLargeGraph: expect.any(Function)
    };
    expect(mapDispatchToProps(dispatch)).toEqual(expectedResult);
  });
});
