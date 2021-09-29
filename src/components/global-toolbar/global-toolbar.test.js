import React from 'react';
import ConnectedGlobalToolbar, {
  GlobalToolbar,
  mapStateToProps,
  mapDispatchToProps,
} from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('GlobalToolbar', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<ConnectedGlobalToolbar />);
    expect(wrapper.find('.pipeline-icon-toolbar__button').length).toBe(5);
  });

  it('hides all buttons (except logo and route buttons) when visible prop is false for each of them', () => {
    const visible = {
      themeBtn: false,
      settingsBtn: false,
    };
    const wrapper = setup.mount(<ConnectedGlobalToolbar />, { visible });
    expect(wrapper.find('.pipeline-icon-toolbar__button').length).toBe(3);
  });

  it('hides one button when visible prop is false for one of them', () => {
    const visible = {
      themeBtn: false,
    };
    const wrapper = setup.mount(<ConnectedGlobalToolbar />, { visible });
    expect(wrapper.find('.pipeline-icon-toolbar__button').length).toBe(4);
  });

  const functionCalls = [
    ['.pipeline-menu-button--theme', 'onToggleTheme'],
    ['.pipeline-menu-button--settings', 'onToggleSettingsModal'],
  ];

  test.each(functionCalls)(
    'calls %s function on %s button click',
    (selector, callback) => {
      const mockFn = jest.fn();
      const props = {
        theme: mockState.animals.theme,
        visible: mockState.animals.visible,
        [callback]: mockFn,
      };
      const wrapper = setup.mount(<GlobalToolbar {...props} />);
      expect(mockFn.mock.calls.length).toBe(0);
      wrapper.find(selector).find('button').simulate('click');
      expect(mockFn.mock.calls.length).toBe(1);
    }
  );

  it('maps state to props', () => {
    const expectedResult = {
      theme: expect.stringMatching(/light|dark/),
      visible: expect.objectContaining({
        exportBtn: expect.any(Boolean),
        settingsBtn: expect.any(Boolean),
        exportModal: expect.any(Boolean),
        plotModal: expect.any(Boolean),
        settingsModal: expect.any(Boolean),
        labelBtn: expect.any(Boolean),
        layerBtn: expect.any(Boolean),
        themeBtn: expect.any(Boolean),
        sidebar: expect.any(Boolean),
      }),
    };
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });

  describe('mapDispatchToProps', () => {
    it('onToggleTheme', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleTheme('light');
      expect(dispatch.mock.calls[0][0]).toEqual({
        theme: 'light',
        type: 'TOGGLE_THEME',
      });
    });

    it('onToggleSettingsModal', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleSettingsModal(true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        visible: true,
        type: 'TOGGLE_SETTINGS_MODAL',
      });
    });
  });
});
