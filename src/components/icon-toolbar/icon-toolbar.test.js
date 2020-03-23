import React from 'react';
import IconToolbar, { mapStateToProps, mapDispatchToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('IconToolbar', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<IconToolbar />);
    expect(wrapper.find('.pipeline-icon-button').length).toBe(4);
  });

  it('hides both buttons when visible prop is false for each of them', () => {
    const visible = {
      themeBtn: false,
      labelBtn: false,
      layerBtn: false,
      exportBtn: false
    };
    const wrapper = setup.mount(<IconToolbar />, { visible });
    expect(wrapper.find('.pipeline-icon-button').length).toBe(0);
  });

  it('hides one button when visible prop is false for one of them', () => {
    const visible = {
      labelBtn: false
    };
    const wrapper = setup.mount(<IconToolbar />, { visible });
    expect(wrapper.find('.pipeline-icon-button').length).toBe(3);
  });

  it('shows the export modal on export button click', () => {
    const wrapper = setup.mount(<IconToolbar />);
    expect(wrapper.find('Modal').props().visible).toBe(false);
    wrapper
      .find({ icon: 'export' })
      .find('button')
      .simulate('click');
    expect(wrapper.find('Modal').props().visible).toBe(true);
  });

  it('maps state to props', () => {
    const expectedResult = {
      disableLayerBtn: expect.any(Boolean),
      textLabels: expect.any(Boolean),
      theme: expect.stringMatching(/light|dark/),
      visible: expect.objectContaining({
        exportBtn: expect.any(Boolean),
        labelBtn: expect.any(Boolean),
        layerBtn: expect.any(Boolean),
        layers: expect.any(Boolean),
        themeBtn: expect.any(Boolean),
        sidebar: expect.any(Boolean)
      })
    };
    expect(mapStateToProps(mockState.lorem)).toEqual(expectedResult);
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();

    mapDispatchToProps(dispatch).onToggleTextLabels(false);
    expect(dispatch.mock.calls[0][0]).toEqual({
      textLabels: false,
      type: 'TOGGLE_TEXT_LABELS'
    });

    mapDispatchToProps(dispatch).onToggleTheme('light');
    expect(dispatch.mock.calls[1][0]).toEqual({
      theme: 'light',
      type: 'TOGGLE_THEME'
    });
  });
});
