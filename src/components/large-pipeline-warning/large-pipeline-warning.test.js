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

  describe('mapDispatchToProps', () => {
    it('disables the size warning flag', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onDisable();
      expect(dispatch.mock.calls[0][0]).toEqual({
        type: 'CHANGE_FLAG',
        name: 'sizewarning',
        value: false,
      });
    });

    it('hides the size warning', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onHide();
      expect(dispatch.mock.calls[0][0]).toEqual({
        type: 'TOGGLE_IGNORE_LARGE_WARNING',
        ignoreLargeWarning: true,
      });
    });
  });
});
