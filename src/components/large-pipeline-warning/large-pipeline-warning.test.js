import React from 'react';
import {
  LargePipelineWarning,
  mapStateToProps,
  mapDispatchToProps,
} from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('LargePipelineWarning', () => {
  it('renders without crashing', () => {
    const mockFn = jest.fn();
    const props = {
      onDisable: mockFn,
      onHide: mockFn,
      nodes: [],
      visible: true,
    };
    const wrapper = setup.mount(<LargePipelineWarning {...props} />);
    expect(wrapper.find('.pipeline-warning').length).toBe(1);
  });

  it('will call onHide upon clicking the "render anyway" button', () => {
    const mockFn = jest.fn();
    const props = {
      onDisable: () => {},
      onHide: mockFn,
      nodes: [],
      visible: true,
    };
    const wrapper = setup.mount(<LargePipelineWarning {...props} />);
    wrapper.find('.kui-button__btn').at(0).simulate('click');
    expect(mockFn.mock.calls.length).toBe(1);
  });

  it('will call onDisable upon clicking the "Don\'t show this again" button', () => {
    const mockFn = jest.fn();
    const props = {
      onDisable: mockFn,
      onHide: () => {},
      nodes: [],
      visible: true,
    };
    const wrapper = setup.mount(<LargePipelineWarning {...props} />);
    wrapper.find('.kui-button__btn').at(1).simulate('click');
    expect(mockFn.mock.calls.length).toBe(1);
  });

  it('maps state to props', () => {
    const expectedResult = {
      theme: expect.any(String),
      nodes: expect.any(Object),
      sidebarVisible: expect.any(Boolean),
      visible: expect.any(Boolean),
    };
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();
    const expectedResult = {
      onDisable: expect.any(Function),
      onHide: expect.any(Function),
    };
    expect(mapDispatchToProps(dispatch)).toEqual(expectedResult);
  });
});
