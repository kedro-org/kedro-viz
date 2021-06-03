import React from 'react';
import ConnectedPrimaryToolbar, {
  PrimaryToolbar,
  mapStateToProps,
  mapDispatchToProps,
} from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('PrimaryToolbar', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<ConnectedPrimaryToolbar />);
    expect(wrapper.find('.pipeline-icon-toolbar__button').length).toBe(5);
  });

  it('hides all buttons (except menu button) when visible prop is false for each of them', () => {
    const visible = {
      themeBtn: false,
      labelBtn: false,
      layerBtn: false,
      exportBtn: false,
    };
    const wrapper = setup.mount(<ConnectedPrimaryToolbar />, { visible });
    expect(wrapper.find('.pipeline-icon-toolbar__button').length).toBe(1);
  });

  it('hides one button when visible prop is false for one of them', () => {
    const visible = {
      labelBtn: false,
    };
    const wrapper = setup.mount(<ConnectedPrimaryToolbar />, { visible });
    expect(wrapper.find('.pipeline-icon-toolbar__button').length).toBe(4);
  });

  const functionCalls = [
    ['.pipeline-menu-button--menu', 'onToggleSidebar'],
    ['.pipeline-menu-button--theme', 'onToggleTheme'],
    ['.pipeline-menu-button--labels', 'onToggleTextLabels'],
    ['.pipeline-menu-button--export', 'onToggleExportModal'],
    ['.pipeline-menu-button--layers', 'onToggleLayers'],
  ];

  test.each(functionCalls)(
    'calls %s function on %s button click',
    (selector, callback) => {
      const mockFn = jest.fn();
      const props = {
        textLabels: mockState.animals.textLabels,
        theme: mockState.animals.theme,
        visible: mockState.animals.visible,
        [callback]: mockFn,
      };
      const wrapper = setup.mount(<PrimaryToolbar {...props} />);
      expect(mockFn.mock.calls.length).toBe(0);
      wrapper.find(selector).find('button').simulate('click');
      expect(mockFn.mock.calls.length).toBe(1);
    }
  );

  it('maps state to props', () => {
    const expectedResult = {
      disableLayerBtn: expect.any(Boolean),
      textLabels: expect.any(Boolean),
      theme: expect.stringMatching(/light|dark/),
      visible: expect.objectContaining({
        exportBtn: expect.any(Boolean),
        exportModal: expect.any(Boolean),
        plotModal: expect.any(Boolean),
        labelBtn: expect.any(Boolean),
        layerBtn: expect.any(Boolean),
        themeBtn: expect.any(Boolean),
        sidebar: expect.any(Boolean),
      }),
      visibleLayers: expect.any(Boolean),
    };
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });

  describe('mapDispatchToProps', () => {
    it('onToggleExportModal', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleExportModal(true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        visible: true,
        type: 'TOGGLE_EXPORT_MODAL',
      });
    });

    it('onToggleLayers', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleLayers(true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        visible: true,
        type: 'TOGGLE_LAYERS',
      });
    });

    it('onToggleSidebar', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleSidebar(true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        visible: true,
        type: 'TOGGLE_SIDEBAR',
      });
    });

    it('onToggleTextLabels', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleTextLabels(true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        textLabels: true,
        type: 'TOGGLE_TEXT_LABELS',
      });
    });

    it('onToggleTheme', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleTheme('light');
      expect(dispatch.mock.calls[0][0]).toEqual({
        theme: 'light',
        type: 'TOGGLE_THEME',
      });
    });
  });
});
